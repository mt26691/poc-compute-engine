import * as gcp from '@pulumi/gcp';

export const createSslCertificate = () => {
  const sslCertificate = new gcp.compute.ManagedSslCertificate(
    'managed-ssl-certificate',
    {
      name: 'linhvuvan-com',
      managed: {
        domains: ['linhvuvan.com'],
      },
    },
  );

  return sslCertificate;
};
