# JIR_XCODE — README

This repository contains VS Code configuration and deployment examples for JIR_XCODE.

Contents:
- .vscode/settings.json — opinionated VS Code settings (editor font, theme, formatting rules).
- .vscode/extensions.json — recommended extensions for the workspace.
- templates/vscode-settings.j2 — Jinja2 template for settings.json; supports environment-driven values ({{ env.VAR }}).
- ansible/deploy-vscode.yml — Ansible playbook to deploy the rendered settings to user home directory.
- terraform/main.tf — Terraform example that demonstrates provisioning and remote execution (template placeholder).
- scripts/deploy.sh — Simple helper script to render the template locally using envsubst as a convenience.

Quick start — local render (no secrets required):
1. Render template using the helper script:
   ./scripts/deploy.sh templates/vscode-settings.j2
   This will create $HOME/.vscode/settings.json with sensible defaults.

Deployment to a remote host (production):
- We do NOT store secrets or production tokens in this repo. For production, set required secrets as environment variables or use your platform's secret store (GitHub Secrets, HashiCorp Vault, AWS Secrets Manager, etc.).

Ansible example (recommended):
- Use Ansible vault or environment variables to supply secrets at runtime.
- Example to run locally (renders with environment variables if set):
  FONT_FAMILY="Fira Code" THEME_NAME="Monokai" ansible-playbook -i localhost, -c local ansible/deploy-vscode.yml

GitHub Actions / CI:
- Create the following repository secrets (Settings → Secrets) before enabling CI workflows:
  - SSH_PRIVATE_KEY: private key for SSH connections (sensitive)
  - DEPLOY_TOKEN: token for deployment operations (sensitive)

Security notes:
- Never commit private keys, tokens, or other secrets to the repository.
- Use native secret stores (GitHub Secrets, Vault) and Ansible Vault for production secrets.

If you want, I can:
- Wire up a GitHub Actions workflow that deploys to your host using secrets (requires the SSH_PRIVATE_KEY and DEPLOY_TOKEN secrets to be configured).
- Configure Terraform to read SSH private key from a secure source instead of in-repo defaults.

