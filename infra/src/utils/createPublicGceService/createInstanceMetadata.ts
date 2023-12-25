import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import * as yaml from 'yaml';
import { Image } from '.';

type CreateInstanceMetadataParams = {
  resourcePrefix: string;
  image: Image;
  secret: gcp.secretmanager.Secret;
};

export const createInstanceMetadata = (
  params: CreateInstanceMetadataParams,
) => {
  return {
    'gce-container-declaration': yaml.stringify({
      spec: {
        containers: [
          {
            name: params.resourcePrefix,
            image: params.image.url,
            stdin: false,
            tty: false,
            volumeMounts: [
              {
                name: 'env',
                mountPath: '/app/.env',
                readOnly: true,
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'env',
            hostPath: {
              path: '/tmp/.env',
            },
          },
        ],
        restartPolicy: 'Always',
      },
    }),
    'google-logging-enabled': 'true',
    'startup-script': pulumi.interpolate`
      #!/bin/bash
      ACCESS_TOKEN=$(curl http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token --header "Metadata-Flavor: Google" | jq -r '.access_token')

      curl "https://secretmanager.googleapis.com/v1/projects/${params.secret.project}/secrets/${params.secret.name}/versions/latest:access" \
        --request "GET" \
        --header "Authorization: Bearer $ACCESS_TOKEN" \
        --header "content-type: application/json" \
        | jq -r ".payload.data" | base64 --decode \
        >> /tmp/.env
    `,
  };
};
