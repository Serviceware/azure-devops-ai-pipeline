# Azure DevOps AI Pipeline

This Azure DevOps task integrates an AI log analysis system to streamline pipeline debugging. It analyzes error logs and provides context-specific hints for swift issue resolution, empowering developers to optimize their pipeline workflows.

## Features

- AI-powered log analysis
- Context-specific debugging hints
- Seamless integration with Azure DevOps

## Changelog

You can find the changelog for this task [here](https://github.com/Serviceware/azure-devops-ai-pipeline/blob/main/CHANGELOG.md).

## Getting Started

1. Install the Azure DevOps AI Pipeline extension from the Azure DevOps marketplace.
2. Add the AI Pipeline task to your existing pipeline. You can try different ways to use it but the recommended way is to add an additional job that checks if the job you want to analize logs from has failed. If it has failed, the AI Pipeline will be triggered. Here an example,

**YAML snippet:**

```yaml
jobs:
  - job: <job name>
    displayName: <display name for your job>
    pool: <name of your pool>
    dependsOn: <Name of the job you want to analize logs from>
    condition: failed()
    steps:
      - task: ai-pipeline@1
        inputs:
          openAiApiKey: my-openai-api-key # Required
          projectId: $(System.TeamProjectId) # Required, Azure DevOps Predefined variable
          buildId: $(Build.BuildId) # Required, Azure DevOps Predefined variable
          azureToken: $(System.AccessToken) # Required, Azure DevOps Predefined variable
          azureHost: my-azure-host.com/my-org # Required
          startMessage: <A custom start message> # Optional
          errorMessage: <A custom error message> # Optional
          responseMessage: <A custom response message> # Optional
          prompt: <A custom prompt>" # Optional
        displayName: A display name # Optional
```

> You can find more info about the predefined variables [here](https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml).

3. Configure the tasks to fit your needs.
