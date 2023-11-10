import * as gcp from '@pulumi/gcp';

type CreateInstanceServiceAccountParams = {
  resourcePrefix: string;
};

export const createInstanceServiceAccount = (
  params: CreateInstanceServiceAccountParams,
) => {
  const serviceAccount = new gcp.serviceaccount.Account(
    `${params.resourcePrefix}-service-account`,
    {
      accountId: params.resourcePrefix,
      displayName: params.resourcePrefix,
    },
  );

  return serviceAccount;
};
