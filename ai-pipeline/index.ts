import { Configuration, OpenAIApi } from "openai";
import * as tl from "azure-pipelines-task-lib/task";
import * as nodefetch from "node-fetch";

interface IBuildTimeline {
  records: ILogRecord[];
}

interface ILogRecord {
  errorCount: number;
  log: {
    url: string;
  };
}

async function run() {
  try {
    const openAiApiKey: string = tl.getInput("openAiApiKey", true);
    const projectId: string = tl.getInput("projectId", true);
    const buildId: string = tl.getInput("buildId", true);
    const azureToken: string = tl.getInput("azureToken", true);
    const azureHost: string = tl.getInput("azureHost", false) || "dev.azure.com";
    const azureOrganization: string = tl.getInput("azureOrganization", true);
    const azureApiVersion: string = tl.getInput("azureApiVersion", false) || "7.0";
    const startMessage: string = tl.getInput("startMessage", false) || "🤖 AI Pipeline: Analizing your logs, please wait...";
    const errorMessage: string = tl.getInput("errorMessage", false) || "🤖 AI Pipeline: Analizing error in the next log";
    const responseMessage: string = tl.getInput("responseMessage", false) || "🤖 AI Pipeline: Here some hints to fix the issue:";
    const prompt: string = tl.getInput("prompt", false) || "Act as a knowledgeable CI/CD Engineer specializing in Azure DevOps pipelines. Always analyze the provided logs, identify the root cause of the issue, and respond with a clear, structured list of actions to resolve the problem. Maintain a professional and helpful tone throughout the conversation. Do you understand?";
    const url = `https://${azureHost}/${azureOrganization}/${projectId}/_apis/build/builds/${buildId}/Timeline?api-version=${azureApiVersion}`;

    console.log(`##[command]${startMessage}`);

    const fetchWithErrorHandling = async (
      requestUrl: string,
    ): Promise<Response> => {
      const response = await nodefetch(requestUrl, {
        headers: {
          Authorization: `Basic ${Buffer.from(":" + azureToken).toString(
            "base64",
          )}`,
        },
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      return response;
    };

    const response = await fetchWithErrorHandling(url);
    const buildTimeline: IBuildTimeline = await response.json();
    const failedLogs: ILogRecord[] = buildTimeline.records.filter(
      (log: ILogRecord): boolean => log.errorCount > 0,
    );

    await Promise.all(
      failedLogs.map(async (failedLog: ILogRecord): Promise<void> => {
        try {
          const logData = await fetchWithErrorHandling(failedLog.log.url);
          const logText = await logData.text();

          const openAiResponse = await callOpenAiApi(
            logText,
            openAiApiKey,
            prompt,
          );

          console.log(`##[error]${errorMessage} => ${failedLog.log.url}`);
          console.log(`##[section]${responseMessage}`, openAiResponse);
          console.log(
            `========================================================`,
          );
        } catch (openAiError) {
          console.error(`##[error]❌ Error in OpenAI call: ${openAiError}`);
        }
      }),
    );
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

async function callOpenAiApi(
  logText: string,
  openAiApiKey: string,
  prompt: string,
): Promise<any> {
  const openAiConfiguration = new Configuration({
    apiKey: openAiApiKey,
  });
  const openai = new OpenAIApi(openAiConfiguration);

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: logText,
      },
    ],
    max_tokens: 500,
    temperature: 0.1,
  });

  const message = response.data.choices[0].message?.content
    ?.split("\n")
    .filter((item: string) => item !== "");

  return message;
}

run();
