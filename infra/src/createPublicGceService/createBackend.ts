import * as gcp from '@pulumi/gcp';

type CreateBackendParams = {
  healthCheck: gcp.compute.HealthCheckArgs;
  instanceGroupManager: gcp.compute.RegionInstanceGroupManager;
};

export const createBackend = (params: CreateBackendParams) => {
  const health = new gcp.compute.HealthCheck(
    'be-health-check',
    params.healthCheck,
  );

  const backend = new gcp.compute.BackendService('backend', {
    protocol: 'HTTP',
    healthChecks: health.id,
    loadBalancingScheme: 'EXTERNAL_MANAGED',
    backends: [
      {
        group: params.instanceGroupManager.instanceGroup,
      },
    ],
  });

  return backend;
};
