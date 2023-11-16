import compute from '@google-cloud/compute';
import * as pulumi from '@pulumi/pulumi';

type CheckAreAllInstancesHealthyProps = {
  instanceTemplate: string;
  numberOfInstances: number;
  instanceGroupManager: string;
  region: string;
  project: string;
};

async function checkAreAllInstancesHealthy(
  props: CheckAreAllInstancesHealthyProps,
) {
  const client = new compute.RegionInstanceGroupManagersClient();

  while (true) {
    const [instances] = await client.listManagedInstances({
      project: props.project,
      region: props.region,
      instanceGroupManager: props.instanceGroupManager.split('/').pop(),
    });

    console.log(props.instanceTemplate, instances);

    const newIntances = instances.filter((instances) => {
      return instances.version?.instanceTemplate?.includes(
        props.instanceTemplate,
      );
    });

    const isHealthy =
      newIntances.every(
        (instance) =>
          instance.instanceStatus === 'RUNNING' &&
          instance.currentAction === 'NONE',
      ) && newIntances.length === props.numberOfInstances;

    if (isHealthy) break;

    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}

export class Wait extends pulumi.dynamic.Resource {
  constructor(name: string, props: any, opts?: pulumi.CustomResourceOptions) {
    super(
      {
        create: async () => ({ id: name }),
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
