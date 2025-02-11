---
title: Ledger
columns: two
layout: commonTwo.hbs
description: Ledger
---

# {{title}}

Ledger allows data to be stored in the cloud, per-device, per-product, or per owner account. 

The three types of Ledgers are:

| Scope | Description |
| :--- | :--- |
| Cloud Ledger | Stores information in the cloud without syncing to the edge. |
| Device to Cloud Ledger | Device storage that syncs automatically to the cloud |
| Cloud to Device Ledger | Set data in the cloud that will sync to devices |

Each ledger is a block of JSON data, up to 16 Kbytes in length. You can define the data format yourself, and it does not need to be pre-defined (no schema required). It can contain simple values (string, number, boolean) as well as nested objects and arrays. JSON does not support binary data, but you can store small binary data by encoding it, such as as hex, Base64, or Base85 encoding.

Device to Cloud and Cloud to Device ledgers require Device OS 6.1.0 or later. They can be up to 16 KBytes in size. 

Cloud only ledgers (not synchronized to a device) can be up to 1 Mbyte (1024 Kbyte).

{{!-- BEGIN shared-blurb f77c1afd-51d7-488a-a090-9786b7133e73 --}}
{{!-- END shared-blurb --}}


## Console

You can view and edit ledgers in the [Particle console](https://console.particle.io). 

Ledger is only available to products, not individual developer devices.

To access Ledger, open the console and select the **Ledger** icon in the left-hand navigation icons.

{{imageOverlay src="/assets/images/ledger/ledger-console.png" class="no-darken"}}

### Select ledger type - console

- Cloud Ledger: Stores information in the cloud without syncing to the edge.
- Device to Cloud Ledger: Device storage that syncs automatically to the cloud.
- Cloud to Device Ledger: Set data in the cloud that will sync to devices.

{{imageOverlay src="/assets/images/ledger/ledger-select.png" class="no-darken"}}

| Scope | Read Ledger | Write Ledger |
| :--- | :--- | :--- |
| Cloud Ledger | Console, Logic, Cloud API | Console, Logic, Cloud API |
| Device to Cloud Ledger | Console, Logic, Cloud API  | Device |
| Cloud to Device Ledger (Owner) | Device in product owned by owner | Console, Logic, Cloud API |
| Cloud to Device Ledger (Product) | Device in specified product | Console, Logic, Cloud API |
| Cloud to Device Ledger (Device) | Device | Console, Logic, Cloud API |



### Ledger options - console

| Option | Description |
| :--- | :--- |
| Ledger Name | Lowercase alphanumeric and dash, up to 32 characters, unique across all scopes |
| Description | Description for your use |
| Scope | Product, Device, Owner |

When scoped to a product, you don't specify the product ID in the options; if that project uses that ledger an instance will automatically be crated.

Likewise, when scoped to device, whenever that device accesses the ledger an instance will automatically be created.

{{imageOverlay src="/assets/images/ledger/ledger-options.png" class="no-darken"}}

### Ledger instances - console

For Owner scoped ledger, there will only be one instance listed:

{{imageOverlay src="/assets/images/ledger/ledger-instances.png" class="no-darken"}}

For product scoped ledgers, if a product accesses the ledger a new instance will be created and can be viewed here.

For device scoped ledgers, if the device accesses the ledger a new instance will be created. 

### View ledger - console

You can also view and edit a ledger instance from the console. In this view, you can add rows, which correspond to top-level values in the JSON data. You can set number (integer or floating point), string, and boolean (`true` or `false`) values using this user interface:

{{imageOverlay src="/assets/images/ledger/ledger-values.png" class="no-darken"}}

### View ledger advanced - console

In the **Advanced** tab, you can set arbitrary JSON data, including nested objects, arrays, and any other valid JSON constructs.

{{imageOverlay src="/assets/images/ledger/ledger-advanced.png" class="no-darken"}}

When using the [Cloud API](/reference/cloud-apis/api/#ledger) you get back the entire JSON data structure for a ledger instance.

## Cloud ledger - console

- Stores information about a device, product or your entire fleet in the cloud.
- Data can be read and written by your applications through the Particle API and Logic Functions.
- Cloud Ledgers cannot be read by a device.

Common use cases:

- Aggregate data about devices using a Logic Function.
- Managing device lifecycle data.
- Parameters for processing in Logic Functions.

{{imageOverlay src="/assets/images/ledger/ledger-cloud.png" class="no-darken"}}

## Device to Cloud ledger - console

- Store information on a device in a structured manner.
- Device OS reliably sends the data to the cloud automatically when device is online.
- Data can be read by your applications through the Particle API and Logic Functions.

Common use cases:

- Make latest device state accessible whether device is online or not.
- Record anomalous events for maintenance and diagnostics.
- Aggregate data on the edge and make a summary available to the cloud.

{{imageOverlay src="/assets/images/ledger/device-to-cloud.png" class="no-darken"}}

For an example of using a Device to Cloud Ledger to store sensor data, see [Ledger sensor](/getting-started/logic-ledger/ledger-sensor/).


## Cloud to Device ledger - console

- Stores information about a device, product or your entire fleet in the cloud.
- Cloud reliably sends latest data to devices as soon as devices get online.
- Data can be scoped to an individual device, to the devices in a product, or to all your devices.
- Data can be read and written by your applications through the Particle API and Logic Functions.

Common use cases:

- Send commands to devices regardless if device is online or not.
- Setting individual device thresholds or parameters.
- Implement policies for a fleet of devices.

{{imageOverlay src="/assets/images/ledger/cloud-to-device.png" class="no-darken"}}

A copy of the ledger is stored locally in the flash file system, so it can be available before connecting to the cloud 
after it has been synchronized once. Of course if the ledger has been updated in the cloud, the changes will not be
available until cloud connected and the ledger synchronized, so in some cases you may want to wait for that to occur.

If the local copy of the ledger is the same as the cloud version, it will not be downloaded again, saving data. 

The maximum ledger size is dependent on a number of factors including RAM and flash size limitations, so on some
platforms, particularly Gen 3 devices like the B Series SoM, Tracker SoM, Boron, and Argon, the limit could be lower.
RAM usage is dependent not only on the total size of the data in the ledger, but also the shape of the data. Arrays 
of small objects, for instance, will use more RAM than a long character string.

### Using Ledger for configuration

One common use case is to store configuration using Ledger. Since each Ledger is scoped to an organization, owner, product, or device, you can implement a custom hierarchy of configuration. For example, you can have product defaults in a product ledger, and device-specific values in a device-specific ledger. You can read both ledgers on-device and implement your own desired override behavior.

For an example of using a Ledger for configuration, see [Ledger configuration](/getting-started/logic-ledger/ledger-configuration/).


## Using Ledger from Logic

You can easily access owner, product, and device ledgers from Logic.

- Store published events in Ledger using Logic.
- Move business logic from device firmware to the cloud using Logic.

See [Using Ledger from Logic](/getting-started/logic-ledger/logic/#using-ledger-from-logic) in the Logic documentation for more information.

## Using Ledger from the Cloud API

Ledger can be also be accessed using the Particle Cloud REST API. See the [Cloud API reference](/reference/cloud-apis/api/#ledger) for more information.


