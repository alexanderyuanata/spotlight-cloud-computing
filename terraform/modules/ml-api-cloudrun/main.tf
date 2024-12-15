resource "google_cloud_run_service" "cloudrun-container-template" {
  name     = var.cr_name
  location = "asia-southeast2"

  template {
    spec {
      containers {
        image = var.cr_image
        ports {
          protocol       = "TCP"
          container_port = "5000"
        }
        resources {
          limits = {
            cpu    = "1000m"
            memory = "1Gi"
          }

        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}