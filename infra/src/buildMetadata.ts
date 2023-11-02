import * as gcp from '@pulumi/gcp';
import * as yaml from 'yaml';
import * as pulumi from '@pulumi/pulumi';
import * as docker from '@pulumi/docker';

export const APP_NAME = 'compute-engine-app';
const IMAGE_REPOSITORY = `gcr.io/${gcp.config.project}/${APP_NAME}:33`;

new docker.Image(APP_NAME, {
  imageName: pulumi.interpolate`${IMAGE_REPOSITORY}`,
  build: {
    context: '../app',
    platform: 'linux/amd64',
  },
});

type Env = {
  DB_PASSWORD: pulumi.Output<string> | undefined;
};

type Metadata = {
  startupScript: pulumi.Output<string>;
};

export const buildStartupScript = (env: Env) => {
  const { DB_PASSWORD } = env;

  return pulumi.interpolate`
    #!/bin/bash
    mkdir /tmp/app
    echo "DB_PASSWORD=${DB_PASSWORD}" >> /tmp/app/.env
  `;
};

export const buildMetadata = (metadata: Metadata) => {
  const { startupScript } = metadata;

  const container = yaml.stringify({
    spec: {
      containers: [
        {
          name: APP_NAME,
          image: IMAGE_REPOSITORY,
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
            path: '/tmp/app/.env',
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
    'startup-script': startupScript,
  };
};
