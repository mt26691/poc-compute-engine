import * as gcp from '@pulumi/gcp';
import * as yaml from 'yaml';
import * as pulumi from '@pulumi/pulumi';
import * as docker from '@pulumi/docker';

export const APP_NAME = 'compute-engine-app';
const IMAGE_REPOSITORY = `gcr.io/${gcp.config.project}/${APP_NAME}:27`;

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
        },
      ],
      restartPolicy: 'Always',
    },
  });

  return {
    'gce-container-declaration': container,
    'google-logging-enabled': 'false',
    'google-logging-use-fluentbit': 'false',
    // 'startup-script': `#!/bin/bash
    //   echo "Running startup script"
    //   export DB_PASSWORD=$(gcloud secrets versions access latest --secret=db_password)
    // `,
  };
};
