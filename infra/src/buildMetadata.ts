import * as gcp from '@pulumi/gcp';
import * as yaml from 'yaml';

const APP_NAME = 'compute-engine-app';
const REVISION = 25;
const IMAGE_REPOSITORY = `gcr.io/${gcp.config.project}/${APP_NAME}:${REVISION}`;

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
    'google-logging-enabled': 'true',
    'google-logging-use-fluentbit': 'true',
  };
};
