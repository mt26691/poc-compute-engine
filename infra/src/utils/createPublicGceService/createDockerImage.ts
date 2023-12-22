import * as docker from '@pulumi/docker';
import { Image } from '.';

type CreateDockerImageParams = {
  resourcePrefix: string;
  image: Image;
};

export const createDockerImage = (params: CreateDockerImageParams) => {
  new docker.Image(`${params.resourcePrefix}-docker`, {
    imageName: params.image.url,
    build: {
      context: params.image.context,
      platform: 'linux/amd64',
    },
  });
};
