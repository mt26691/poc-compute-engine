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

    echo "======================================= echo docker info"
    which docker
    docker info
    docker ps -a
    
    echo "======================================= echo container id"
    docker ps -q

    # echo "======================================= stopping container"
    # /bin/sh -c 'docker ps -q | xargs docker stop --signal=SIGTERM --time 60'
    # docker ps -a

    echo "======================================= stopping container another way"
    docker ps -q | xargs docker stop
    echo "======================================= stopped container"

    docker ps -a
    
    echo "======================================= end of shutdown script"
  `;
};
