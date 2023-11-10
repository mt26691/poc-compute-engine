import * as gcp from '@pulumi/gcp';

type CreateBackendParams = {
  resourcePrefix: string;
  healthCheck: gcp.compute.HealthCheckArgs;
  instanceGroupManager: gcp.compute.RegionInstanceGroupManager;
};

export const createBackend = (params: CreateBackendParams) => {
  const health = new gcp.compute.HealthCheck(
    `${params.resourcePrefix}-be-health-check`,
    params.healthCheck,
  );

  const backend = new gcp.compute.BackendService(
    `${params.resourcePrefix}-be`,
    {
      protocol: 'HTTP',
      healthChecks: health.id,
      loadBalancingScheme: 'EXTERNAL_MANAGED',
      backends: [
        {
          group: params.instanceGroupManager.instanceGroup,
        },
      ],
    },
  );

  return backend;
};
