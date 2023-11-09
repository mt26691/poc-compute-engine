import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';

type CreateApplicationLoadBalancerParams = {
  backend: gcp.compute.BackendService;
  sslCertificate: gcp.compute.ManagedSslCertificate;
};

export const createApplicationLoadBalancer = (
  params: CreateApplicationLoadBalancerParams,
) => {
  const { address: ipAddress } = new gcp.compute.GlobalAddress('address');

  const map = new gcp.compute.URLMap('map', {
    defaultService: params.backend.id,
  });

  // https
  const httpsProxy = new gcp.compute.TargetHttpsProxy('https-proxy', {
    urlMap: map.id,
    sslCertificates: [params.sslCertificate.id],
  });

  new gcp.compute.GlobalForwardingRule('https-rule', {
    target: httpsProxy.id,
    ipAddress,
    portRange: '443',
    loadBalancingScheme: 'EXTERNAL_MANAGED',
  });

  // http
  const redirectMap = new gcp.compute.URLMap('redirect-map', {
    defaultUrlRedirect: {
      httpsRedirect: true,
      stripQuery: false,
      redirectResponseCode: 'MOVED_PERMANENTLY_DEFAULT',
    },
  });

  const httpProxy = new gcp.compute.TargetHttpProxy('http-proxy', {
    urlMap: redirectMap.id,
  });

  new gcp.compute.GlobalForwardingRule('http-rule', {
    target: httpProxy.id,
    ipAddress,
    portRange: '80',
    loadBalancingScheme: 'EXTERNAL_MANAGED',
  });

  // dns
  new gcp.dns.RecordSet('record-set', {
    managedZone: 'linhvuvan-com',
    name: 'linhvuvan.com.',
    type: 'A',
    rrdatas: [ipAddress],
    ttl: 300,
  });

  return { ipAddress };
};
