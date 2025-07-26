# Sign in with Ethereum Example App

This is a simple example app showing how to use Sign in with Ethereum (SiwE) with Express.  It is closer to a real-world
example than some others, because it includes checks (eg, for inclusion in a smart contract or that the account
has a minimum balance) that real-world apps will likely want to perform.

## Quick Start

This is a `stack`-enabled project, so even though there is quite a bit of behind-the-scenes setup that needs to happen
to exercise it properly (eg, setting up a blockchain, deploying smart contracts, etc.) you can run it very simply with:

```
# Fetch this repo.
$ stack fetch repo bozemanpass/siwe-express-example

# Build/download all the containers.
$ stack prepare --stack siwe-on-fixturenet

# Deploy and run it.
$ stack init --stack siwe-on-fixturenet --output siwe.yml
$ stack deploy --spec-file siwe.yml --deployment-dir ~/siwe
$ stack manage --dir ~/siwe start
```

This will fire up a local blockchain, deploy the smart contract, and start the app.  When using Docker, the HTTP port
will be randomly selected, but you can show it easily by running:

```
$ stack manage --dir ~/siwe port siwe 3200
0.0.0.0:62241
```

## System Diagram
Auto-generated using the `stack chart` command:
<!-- CHART_BEGIN -->
```mermaid
flowchart RL
  fixturenet-eth-fxeth-geth-1-http>":8545 (/eth/)"]:::http_target
  siwe-express-example-siwe-http>":3200 (/)"]:::http_target
  fixturenet-eth-fxeth-geth-1-http --> fixturenet-eth-fxeth-geth-1
  siwe-express-example-siwe-http --> siwe-express-example-siwe
  fixturenet-eth --> siwe-express-example
  siwe-express-example --> fixturenet-eth
  subgraph siwe-on-fixturenet [siwe-on-fixturenet]
    subgraph fixturenet-eth [fixturenet-eth]
      fixturenet-eth-fxeth-bootnode-geth[[fxeth-bootnode-geth]]:::service
      fixturenet-eth-fxeth-bootnode-geth-volume-fxeth-bootnode-geth-data:/data(fxeth-bootnode-geth-data:/data):::volume
      fixturenet-eth-fxeth-geth-1[[fxeth-geth-1]]:::http_service
      fixturenet-eth-fxeth-geth-1-volume-fxeth-geth-1-data:/data(fxeth-geth-1-data:/data):::volume
      fixturenet-eth-fxeth-geth-2[[fxeth-geth-2]]:::service
      fixturenet-eth-fxeth-geth-2-volume-fxeth-geth-2-data:/data(fxeth-geth-2-data:/data):::volume
      fixturenet-eth-fxeth-bootnode-lighthouse[[fxeth-bootnode-lighthouse]]:::service
      fixturenet-eth-fxeth-bootnode-lighthouse-volume-fxeth-bootnode-lighthouse-data:/data(fxeth-bootnode-lighthouse-data:/data):::volume
      fixturenet-eth-fxeth-lighthouse-1[[fxeth-lighthouse-1]]:::service
      fixturenet-eth-fxeth-lighthouse-1-volume-fxeth-lighthouse-1-data:/data(fxeth-lighthouse-1-data:/data):::volume
      fixturenet-eth-fxeth-lighthouse-2[[fxeth-lighthouse-2]]:::service
      fixturenet-eth-fxeth-lighthouse-2-volume-fxeth-lighthouse-2-data:/data(fxeth-lighthouse-2-data:/data):::volume
      fixturenet-eth-fxeth-bootnode-geth --> fixturenet-eth-fxeth-bootnode-geth-volume-fxeth-bootnode-geth-data:/data
      fixturenet-eth-fxeth-geth-1 --> fixturenet-eth-fxeth-geth-1-volume-fxeth-geth-1-data:/data
      fixturenet-eth-fxeth-geth-2 --> fixturenet-eth-fxeth-geth-2-volume-fxeth-geth-2-data:/data
      fixturenet-eth-fxeth-bootnode-lighthouse --> fixturenet-eth-fxeth-bootnode-lighthouse-volume-fxeth-bootnode-lighthouse-data:/data
      fixturenet-eth-fxeth-lighthouse-1 --> fixturenet-eth-fxeth-lighthouse-1-volume-fxeth-lighthouse-1-data:/data
      fixturenet-eth-fxeth-lighthouse-2 --> fixturenet-eth-fxeth-lighthouse-2-volume-fxeth-lighthouse-2-data:/data
    end
    subgraph siwe-express-example [siwe-express-example]
      siwe-express-example-siwe[[siwe]]:::http_service
      siwe-express-example-siwe-volume-siwe-data:/data(siwe-data:/data):::volume
      siwe-express-example-siwe --> siwe-express-example-siwe-volume-siwe-data:/data
    end
  end
  classDef super_stack stroke:#FFF176,fill:#FFFEEF,color:#6B5E13,stroke-width:2px,font-size:small;
  classDef stack stroke:#00C9A7,fill:#EDFDFB,color:#1A3A38,stroke-width:2px,font-size:small;
  classDef service stroke:#43E97B,fill:#F5FFF7,color:#236247,stroke-width:2px;
  classDef http_service stroke:#FFB236,fill:#FFFAF4,color:#7A5800,stroke-width:2px;
  classDef http_target stroke:#FF6363,fill:#FFF5F5,color:#7C2323,stroke-width:2px;
  classDef port stroke:#26C6DA,fill:#E6FAFB,color:#074953,stroke-width:2px,font-size:x-small;
  classDef volume stroke:#A259DF,fill:#F4EEFB,color:#320963,stroke-width:2px,font-size:x-small;
  class siwe-on-fixturenet super_stack;
  class fixturenet-eth stack;
  class siwe-express-example stack;
```
<!-- CHART_END -->
