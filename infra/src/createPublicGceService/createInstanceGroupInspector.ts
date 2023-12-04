import compute from '@google-cloud/compute';
import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { waitSec } from '../utils/wait';

type CreateInstanceGroupInspectorParams = {
  resourcePrefix: string;
  region: string;
  project: string;
  numberOfInstances: number;
  initialStartupDelaySec: number;
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

const THIRTY_MINUTES = 30 * 60;
const TIME_INTERVAL = 10;

async function checkAreAllInstancesHealthy(
  props: CheckAreAllInstancesHealthyProps,
): Promise<void> {
  const client = new compute.RegionInstanceGroupManagersClient();
  let isHealthy = false;
  let attempts = 0;
  const maxAttempts = THIRTY_MINUTES / TIME_INTERVAL;

  while (!isHealthy) {
    if (attempts > maxAttempts) {
      throw new Error(
        `Instance group manager ${props.instanceGroupManager} is not healthy after ${maxAttempts} attempts`,
      );
    }

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

    console.log(`Attempts number ${attempts}`, {
      isHealthy,
      instanceTemplate: props.instanceTemplate,
      instances,
      newInstances,
    });

    if (!isHealthy) {
      attempts += 1;
      await waitSec(TIME_INTERVAL);
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

          return { id: name, failures: [] };
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
  return new InstanceGroupInspector(
    `${params.resourcePrefix}-inspector`,
    params,
  );
};
