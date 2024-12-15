terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = "cc-aseng"
  region  = "asia-southeast2" # Replace with your desired region
}

resource "google_project" "cc-project" {
  name       = "cc-aseng"
  project_id = "cc-aseng"
  billing_account = "01D302-F21F95-C1E500"
  labels = {
    "firebase" = "enabled"
  }

  timeouts {
    
  }
}

resource "google_app_engine_application" "backend-appengine" {
  project     = google_project.cc-project.project_id
  location_id = "asia-southeast2"
}

resource "google_artifact_registry_repository" "default" {
  location      = "asia-southeast2"
  repository_id = "ml-api-containers"
  format        = "DOCKER"
  description   = "A repository to store containers for ML APIs"
}

module "stress-api-cloudrun" {
    source = "./modules/ml-api-cloudrun"
    
    cr_name="stress-prediction-api"
    cr_image="asia-southeast2-docker.pkg.dev/cc-aseng/ml-api-containers/stress-api:v1"
}

module "book-api-cloudrun" {
    source = "./modules/ml-api-cloudrun"
    
    cr_name="book-recommendation-api"
    cr_image="asia-southeast2-docker.pkg.dev/cc-aseng/ml-api-containers/book-api:v1"
}

module "movie-api-cloudrun" {
    source = "./modules/ml-api-cloudrun"
    
    cr_name="movie-recommendation-api"
    cr_image="asia-southeast2-docker.pkg.dev/cc-aseng/ml-api-containers/movie-api:v1"
}

module "travel-api-cloudrun" {
    source = "./modules/ml-api-cloudrun"
    
    cr_name="travel-recommendation-api"
    cr_image="asia-southeast2-docker.pkg.dev/cc-aseng/ml-api-containers/travel-api:v1"
}
