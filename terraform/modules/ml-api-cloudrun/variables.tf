variable "cr_name" {
  type    = string
  description = "The name of the Cloud Run container service"
}

variable "cr_image" {
  type    = string
  description = "The container image to deploy to cloud run"
}