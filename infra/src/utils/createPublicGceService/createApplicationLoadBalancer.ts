import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';

type CreateApplicationLoadBalancerParams = {
  resourcePrefix: string;
  backend: gcp.compute.BackendService;
  sslCertificates: gcp.compute.ManagedSslCertificate[];
  domain: string;
  managedZone: string;
};

export const createApplicationLoadBalancer = (
  params: CreateApplicationLoadBalancerParams,
) => {
  const { address: ipAddress } = new gcp.compute.GlobalAddress(
    `${params.resourcePrefix}-address`,
  );

  const map = new gcp.compute.URLMap(`${params.resourcePrefix}-map`, {
    defaultService: params.backend.id,
  });

  // https
  const httpsProxy = new gcp.compute.TargetHttpsProxy(
    `${params.resourcePrefix}-https-proxy`,
    {
      urlMap: map.id,
      sslCertificates: params.sslCertificates.map((item) => item.id),
    },
  );

  new gcp.compute.GlobalForwardingRule(`${params.resourcePrefix}-https-rule`, {
    target: httpsProxy.id,
    ipAddress,
    portRange: '443',
    loadBalancingScheme: 'EXTERNAL_MANAGED',
  });

  // http
  const redirectMap = new gcp.compute.URLMap(
    `${params.resourcePrefix}-redirect-map`,
    {
      defaultUrlRedirect: {
        httpsRedirect: true,
        stripQuery: false,
        redirectResponseCode: 'MOVED_PERMANENTLY_DEFAULT',
      },
    },
  );

  const httpProxy = new gcp.compute.TargetHttpProxy(
    `${params.resourcePrefix}-http-proxy`,
    {
      urlMap: redirectMap.id,
    },
  );

  new gcp.compute.GlobalForwardingRule(`${params.resourcePrefix}-http-rule`, {
    target: httpProxy.id,
    ipAddress,
    portRange: '80',
    loadBalancingScheme: 'EXTERNAL_MANAGED',
  });

  // dns
  new gcp.dns.RecordSet(`${params.resourcePrefix}-record-set`, {
    managedZone: params.managedZone,
    name: `${params.domain}.`,
    type: 'A',
    rrdatas: [ipAddress],
    ttl: 300,
  });
};
