import * as docker from '@pulumi/docker';
import * as pulumi from '@pulumi/pulumi';

type CreateDockerImageParams = {
  image: {
    url: string;
  };
};

export const createDockerImage = (params: CreateDockerImageParams) => {
  new docker.Image('docker', {
    imageName: params.image.url,
    build: {
      context: '../app',
      platform: 'linux/amd64',
    },
  });
};
