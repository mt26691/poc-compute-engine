import * as gcp from '@pulumi/gcp';

type CreateSslCertificatesParams = {
  resourcePrefix: string;
  domains: string[];
};

export const createSslCertificates = (params: CreateSslCertificatesParams) => {
  return params.domains.map((domain) => {
    return new gcp.compute.ManagedSslCertificate(
      `${params.resourcePrefix}-${domain.replace(/\./g, '-')}`,
      {
        managed: {
          domains: [domain],
        },
      }
    );
  });
};
