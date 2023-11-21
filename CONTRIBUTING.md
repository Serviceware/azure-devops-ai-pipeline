# Contributing to Azure DevOps AI Pipeline

### Report bugs

No one likes bugs. Report bugs [here](https://github.com/Serviceware/azure-devops-ai-pipeline/issues).

## Coding Guidelines

### Naming conventions

- Folders: camelCase (myFolder)
- Ts files: camelCase (myFile.ts)

## Husky

Commits must

## PR Policies

The next policies are checked when creating a PR:

- Code it's formatted
- Lint pass in green
- A changeset exist for the changes
- Commit message it's signed off
- Tests pass in green

### Commands:

1. Run the task for development:

```bash
npm run dev
```

2. Run unit tests:

```bash
npm run build
npm run test
```

3. Format code:

```bash
npm run prettier:format
```

4. Run lint:

```bash
npm run lint
```

5. Create a commit:

```bash
npm run commit -- "chore(scope): my commit message"
```
