variable "deploy_target" {
  description = "Target host to deploy to (ssh)"
  type        = string
  default     = "prod.example.com"
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

variable "ssh_private_key" {
  description = "SSH private key for connecting to the deploy target (sensitive)"
  type        = string
  sensitive   = true
  default     = ""
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
    user        = "ubuntu"
    # For real use: provide private_key or agent forwarding via the connection block
    # private_key = var.ssh_private_key
  }
}
