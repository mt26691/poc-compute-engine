import * as gcp from '@pulumi/gcp';

type CreateSslCertificateParams = {
  resourcePrefix: string;
  domain: string;
  managedZone: string;
};

export const createSslCertificate = (params: CreateSslCertificateParams) => {
  const sslCertificate = new gcp.compute.ManagedSslCertificate(
    `${params.resourcePrefix}-managed-ssl-certificate`,
    {
      name: params.managedZone,
      managed: {
        domains: [params.domain],
      },
    },
  );

  return sslCertificate;
};
