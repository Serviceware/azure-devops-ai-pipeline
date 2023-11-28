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
    const azureHost: string = tl.getInput("azureHost", true);
    const startMessage: string = tl.getInput("startMessage", true);
    const errorMessage: string = tl.getInput("errorMessage", true);
    const responseMessage: string = tl.getInput("responseMessage", true);
    const prompt: string = tl.getInput("prompt", true);
    const url = `https://${azureHost}/${projectId}/_apis/build/builds/${buildId}/Timeline`;

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
