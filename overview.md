# Azure DevOps AI Pipeline

This Azure DevOps task integrates an AI log analysis system to streamline pipeline debugging. It analyzes error logs and provides context-specific hints for swift issue resolution, empowering developers to optimize their pipeline workflows.

## Features

- AI-powered log analysis
- Context-specific debugging hints
- Seamless integration with Azure DevOps

## Changelog

You can find the changelog for this task [here](https://github.com/Serviceware/azure-devops-ai-pipeline/blob/main/CHANGELOG.md).

## Prerequisites

To use this task, you need your own OpenAI API key. This can be obtained from your personal or company OpenAI account in the [OpenAi Platform](https://platform.openai.com/). This key is required for the `openAiApiKey` parameter in the task.

## Getting Started

1. Install the Azure DevOps AI Pipeline extension from the Azure DevOps marketplace.
2. Add the AI Pipeline task to your existing pipeline. You can try different ways to use it but the recommended way is to add an additional job that checks if the job you want to analyze logs from has failed. If it has failed, the AI Pipeline will be triggered. Here is an example,

**YAML snippet:**

```yaml
jobs:
  - job: <job name>
    displayName: <display name for your job>
    pool: <name of your pool>
    dependsOn: <Name of the job you want to analyze logs from>
    condition: failed()
    steps:
      - task: ai-pipeline@1
        inputs:
          openAiApiKey: my-openai-api-key # Required (Get it from your own OpenAI account)
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

## Handling API Limitations

Please be aware that the OpenAI API has a rate limit. If you encounter a 429 error, this means you have reached your token limit. You may need to review your usage or contact OpenAI to request a higher limit.
