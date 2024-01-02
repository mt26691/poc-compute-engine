import * as yaml from 'yaml';
import { buildShutdownScript } from './buildScript';

type Container = {
  name: string;
  image: string;
  volumeMounts: {
    name: string;
    readOnly: boolean;
    mountPath: string;
  }[];
  stdin: boolean;
  tty: boolean;
};

type Volume = {
  name: string;
  hostPath: {
    path: string;
  };
};

type ContainerDeclaration = {
  spec: {
    containers: Container[];
    volumes: Volume[];
    restartPolicy: 'Always' | 'OnFailure' | 'Never';
  };
};

type BuildInstanceMetadataParams = {
  containerDeclaration: ContainerDeclaration;
};

export const buildInstanceMetadata = (params: BuildInstanceMetadataParams) => {
  return {
    'gce-container-declaration': yaml.stringify(params.containerDeclaration),
    /**
     * Enable logging in COS
     * https://cloud.google.com/container-optimized-os/docs/how-to/logging
     */
    'google-logging-enabled': 'true',
    'shutdown-script': buildShutdownScript(),
  };
};
