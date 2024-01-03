import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { SecretVolume } from '.';

type BuildStartupScriptParams = {
  secretVolume: SecretVolume;
  secret: gcp.secretmanager.Secret;
};

export const buildStartupScript = (params: BuildStartupScriptParams) => {
  return pulumi.interpolate`
    #!/bin/bash
    echo "startup script"

    ACCESS_TOKEN=$( \
      curl http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token \
        --header "Metadata-Flavor: Google" \
        | jq -r '.access_token' \
    )

    curl "https://secretmanager.googleapis.com/v1/projects/${params.secret.project}/secrets/${params.secret.secretId}/versions/latest:access" \
      --request "GET" \
      --header "Authorization: Bearer $ACCESS_TOKEN" \
      --header "content-type: application/json" \
      | jq -r ".payload.data" | base64 --decode \
      >> ${params.secretVolume.hostPath}
  `;
};

export const buildShutdownScript = () => {
  return pulumi.interpolate`
    #!/bin/bash
    echo "shutdown script"

    echo "======================================= docker info"
    docker info

    echo "======================================= command: docker ps -a"
    docker ps -a
    
    echo "======================================= command: docker ps -q"
    CONTAINER_ID=$(docker ps -q)
    echo $CONTAINER_ID

    echo "======================================= command: ls -l /var/run/docker.sock"
    ls -l /var/run/docker.sock

    echo "======================================= stopping container"
    docker ps -q | xargs docker kill
    echo "======================================= stopped container"

    echo "======================================= command: docker ps -a"
    docker logs $CONTAINER_ID

    echo "======================================= command: docker ps -a"
    docker ps -a

    echo "======================================= command: sleep 30"
    sleep 30
    
    echo "======================================= end of shutdown script"
  `;
};
