import { Configuration, OpenAIApi } from "openai";
const tl = require("azure-pipelines-task-lib/task");
const nodefetch = require("node-fetch");

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
    const azureHost: string = tl.getInput("azureHost", true) || "dev.azure.com";
    const url = `https://${azureHost}/${projectId}/_apis/build/builds/${buildId}/Timeline`;

    console.log(
      `##[command]🤖 AI Pipeline: Analizing your logs, please wait...`,
    );

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

          const openAiResponse = await callOpenAiApi(logText, openAiApiKey);

          console.log(
            `##[error]🤖 AI Pipeline: Found errors in the next step => ${failedLog.log.url}, generating hints to fix them...`,
          );
          console.log(`##[section]🤖 AI Pipeline:`, openAiResponse);
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
        content:
          "Act as a knowledgeable CI/CD Engineer specializing in Azure DevOps pipelines. Always analyze the provided logs, identify the root cause of the issue, and respond with a clear, structured list of actions to resolve the problem. Maintain a professional and helpful tone throughout the conversation. Do you understand?",
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
