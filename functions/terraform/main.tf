terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "3.5.0"
    }
  }
}

provider "google" {
  credentials = file("../credentials/gcp-terraform.json")
  project     = var.project
  region      = var.region
}

module "create_functions_bucket" {
  source = "./modules/buckets/function_code"
}

module "deploy_functions" {
  source               = "./modules/functions"
  functions_bucket_name = module.create_functions_bucket.bucket_name
  project              = var.project
}

module "get_nba_games" {
  source                 = "./modules/functions/getNbaGames"
  project                = var.project
  functions_bucket_name  = module.create_functions_bucket.bucket_name
  functions_zipfile_name = module.deploy_functions.functions_zipfile_name
  function_entry_point   = "getNbaGames"
}
