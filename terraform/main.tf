variable "deploy_target" {
  description = "Target host to deploy to (ssh)"
  type        = string
}

variable "deploy_branch" {
  description = "Branch to use for deployment"
  type        = string
  default     = "main"
}

variable "deploy_token" {
  description = "Deployment token (sensitive)"
  type        = string
  sensitive   = true
}

resource "null_resource" "deploy_vscode_settings" {
  provisioner "file" {
    source      = "templates/vscode-settings.j2"
    destination = "/tmp/vscode-settings.json.j2"
  }

  provisioner "file" {
    source      = "scripts/deploy.sh"
    destination = "/tmp/deploy_vscode.sh"
    on_failure  = continue
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /tmp/deploy_vscode.sh",
      "/tmp/deploy_vscode.sh /tmp/vscode-settings.json.j2"
    ]
  }

  connection {
    type        = "ssh"
    host        = var.deploy_target
    user        = "${var.deploy_token != "" ? "ubuntu" : "your_username"}"
    # Replace with your actual SSH credentials and private_key configuration as needed.
  }
}
