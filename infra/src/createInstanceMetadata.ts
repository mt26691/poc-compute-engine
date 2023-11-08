import * as gcp from '@pulumi/gcp';
import * as yaml from 'yaml';
import * as pulumi from '@pulumi/pulumi';
import * as docker from '@pulumi/docker';

export const APP_NAME = 'compute-engine-app';
export const config = new pulumi.Config('poc-compute-engine');

const IMAGE_REPOSITORY = `gcr.io/linhvuvan-image-holder/${APP_NAME}:33`;

new docker.Image(APP_NAME, {
  imageName: pulumi.interpolate`${IMAGE_REPOSITORY}`,
  build: {
    context: '../app',
    platform: 'linux/amd64',
  },
});

const buildStartupScript = () => {
  return `
    #!/bin/bash
    PROJECT_ID=linhvuvan-397815
    SECRET_NAME=wms
    SECRET_VERSION=latest
    
    ACCESS_TOKEN=$(curl http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token --header "Metadata-Flavor: Google" | jq -r '.access_token')

    curl "https://secretmanager.googleapis.com/v1/projects/$PROJECT_ID/secrets/$SECRET_NAME/versions/$SECRET_VERSION:access" \
      --request "GET" \
      --header "Authorization: Bearer $ACCESS_TOKEN" \
      --header "content-type: application/json" \
      | jq -r ".payload.data" | base64 --decode \
      >> /tmp/.env
  `;
};

export const createInstanceMetadata = () => {
  const container = yaml.stringify({
    spec: {
      containers: [
        {
          name: APP_NAME,
          image: IMAGE_REPOSITORY,
          stdin: false,
          tty: false,
          env: [
            {
              name: 'DB_NAME',
              value: config.get('dbName'),
            },
            {
              name: 'DB_USER',
              value: 'root',
            },
          ],
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
  });

  return {
    'gce-container-declaration': container,
    'google-logging-enabled': 'true',
    'google-logging-use-fluentbit': 'true',
    'startup-script': buildStartupScript(),
  };
};
