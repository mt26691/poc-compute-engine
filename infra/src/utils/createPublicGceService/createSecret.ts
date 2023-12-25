import * as gcp from '@pulumi/gcp';
import { SecretData } from '.';

type CreateSecretParams = {
  resourcePrefix: string;
  secretData: SecretData;
};

export const createSecret = (params: CreateSecretParams) => {
  const secret = new gcp.secretmanager.Secret(
    `${params.resourcePrefix}-secret`,
    {
      secretId: params.resourcePrefix,
      replication: {
        automatic: true,
      },
    },
  );

  new gcp.secretmanager.SecretVersion(
    `${params.resourcePrefix}-secret-version`,
    {
      secret: secret.id,
      secretData: params.secretData,
    },
  );

  return secret;
};
