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

    mkdir -p /etc/systemd/system/docker.service.d
    printf "[Service]\nExecStop=/bin/sh -c 'docker ps -q | xargs docker stop --time 60'" > /etc/systemd/system/docker.service.d/override.conf
    systemctl daemon-reload
    systemctl restart docker
  `;
};