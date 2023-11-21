import compute from '@google-cloud/compute';
import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { waitSec } from '../utils/wait';

type CreateInstanceGroupInspectorParams = {
  resourcePrefix: string;
  region: string;
  project: string;
  numberOfInstances: number;
  instanceTemplate: gcp.compute.InstanceTemplate;
  instanceGroupManager: gcp.compute.RegionInstanceGroupManager;
};

type InstanceGroupInspectorProps = Omit<
  CreateInstanceGroupInspectorParams,
  'resourcePrefix'
>;

type CheckAreAllInstancesHealthyProps = InstanceGroupInspectorProps & {
  instanceTemplate: string;
  instanceGroupManager: string;
};

async function checkAreAllInstancesHealthy(
  props: CheckAreAllInstancesHealthyProps,
): Promise<void> {
  const client = new compute.RegionInstanceGroupManagersClient();
  let isHealthy = false;

  while (!isHealthy) {
    const [instances] = await client.listManagedInstances({
      project: props.project,
      region: props.region,
      instanceGroupManager: props.instanceGroupManager.split('/').pop(),
    });

    const newInstances = instances.filter((instance) =>
      instance.version?.instanceTemplate?.includes(props.instanceTemplate),
    );

    isHealthy =
      newInstances.every(
        (instance) =>
          instance.instanceStatus === 'RUNNING' &&
          instance.currentAction === 'NONE',
      ) && newInstances.length === props.numberOfInstances;

    console.log({
      isHealthy,
      instances,
      newInstances,
      props,
    });

    if (!isHealthy) {
      await waitSec(10);
    }
  }
}

class InstanceGroupInspector extends pulumi.dynamic.Resource {
  constructor(
    name: string,
    props: InstanceGroupInspectorProps,
    opts?: pulumi.CustomResourceOptions,
  ) {
    super(
      {
        create: async (inputs) => {
          await checkAreAllInstancesHealthy(inputs);

          return { id: name };
        },
        update: async (id, olds, news) => {
          await checkAreAllInstancesHealthy(news);

          return {
            outs: { id },
          };
        },
      },
      name,
      props,
      opts,
    );
  }
}

export const createInstanceGroupInspector = (
  params: CreateInstanceGroupInspectorParams,
) => {
  new InstanceGroupInspector(`${params.resourcePrefix}-inspector`, {
    instanceTemplate: params.instanceTemplate,
    numberOfInstances: params.numberOfInstances,
    instanceGroupManager: params.instanceGroupManager,
    region: params.region,
    project: params.project,
  });
};
