import * as docker from '@pulumi/docker';
import { Image } from '..';

type CreateDockerImageParams = {
  image: Image;
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
