import * as tl from "azure-pipelines-task-lib/task";

async function run() {
  try {
    const inputString: string | undefined = tl.getInput("samplestring", true);
    if (inputString === "bad") {
      tl.setResult(tl.TaskResult.Failed, "Bad input was given");
      return;
    }
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
