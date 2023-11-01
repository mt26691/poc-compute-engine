import * as gcp from '@pulumi/gcp';
import * as yaml from 'yaml';
import * as pulumi from '@pulumi/pulumi';
import * as docker from '@pulumi/docker';

export const APP_NAME = 'compute-engine-app';
const IMAGE_REPOSITORY = `gcr.io/${gcp.config.project}/${APP_NAME}:33`;

const config = new pulumi.Config('poc-compute-engine');

new docker.Image(APP_NAME, {
  imageName: pulumi.interpolate`${IMAGE_REPOSITORY}`,
  build: {
    context: '../app',
    platform: 'linux/amd64',
  },
});

export const buildMetadata = () => {
  const container = yaml.stringify({
    spec: {
      containers: [
        {
          name: APP_NAME,
          image: IMAGE_REPOSITORY,
          stdin: false,
          tty: false,
          // env: [
          //   {
          //     name: 'DB_PASSWORD',
          //     value: config.requireSecret('dbPassword'),
          //   },
          // ],
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
    'startup-script': pulumi.interpolate`
      #!/bin/bash
      echo "Script verion 12"
      mkdir /tmp/app
      echo "DB_PASSWORD=${config.requireSecret('dbPassword')}" >> /tmp/app/.env
    `,
  };
};
