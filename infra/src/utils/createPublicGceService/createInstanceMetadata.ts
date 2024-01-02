import * as gcp from '@pulumi/gcp';
import * as yaml from 'yaml';
import { Image, SecretVolume } from '.';
import { buildShutdownScript } from './buildStartupScript';

type CreateInstanceMetadataParams = {
  resourcePrefix: string;
  image: Image;
  secret: gcp.secretmanager.Secret;
  secretVolume: SecretVolume;
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
                name: params.secretVolume.name,
                mountPath: params.secretVolume.mountPath,
                readOnly: true,
              },
            ],
          },
        ],
        volumes: [
          {
            name: params.secretVolume.name,
            hostPath: {
              path: params.secretVolume.hostPath,
            },
          },
        ],
        restartPolicy: 'Always',
      },
    }),
    'shutdown-script': buildShutdownScript(),
    'google-logging-enabled': 'true',
  };
};
