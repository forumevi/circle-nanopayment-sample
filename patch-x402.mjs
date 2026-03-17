/**
 * Patches x402 node_modules to add Arc testnet support.
 *
 * x402 v1.1.0 does not include arc-testnet in its built-in network list.
 * This script adds:
 *   - "arc-testnet" to NetworkSchema, SupportedEVMNetworks, EvmNetworkToChainId
 *   - chain ID 5042002 with USDC config to the config map
 *
 * Run after `npm install`:
 *   node patch-x402.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const NM = './node_modules/x402/dist'

const PATCHES = [
  // ESM: types / shared chunk (NetworkSchema enum, SupportedEVMNetworks array, EvmNetworkToChainId map)
  {
    file: join(NM, 'esm/chunk-7OUVQHDC.mjs'),
    replacements: [
      // NetworkSchema z.enum - add before closing ]
      ['"skale-base-sepolia"\n])', '"skale-base-sepolia",\n  "arc-testnet"\n])'],
      // SupportedEVMNetworks array - add before closing ]
      ['"skale-base-sepolia"\n];', '"skale-base-sepolia",\n  "arc-testnet"\n];'],
      // EvmNetworkToChainId map - add before closing ]
      ['["skale-base-sepolia", 324705682]\n]);', '["skale-base-sepolia", 324705682],\n  ["arc-testnet", 5042002]\n]);'],
    ],
  },
  // ESM: config chunk (USDC address for chain 5042002)
  {
    file: join(NM, 'esm/chunk-EMSAO3AI.mjs'),
    replacements: [
      // Add arc-testnet config before base-sepolia
      ['var config = {', 'var config = {\n  "5042002": {\n    usdcAddress: "0x3600000000000000000000000000000000000000",\n    usdcName: "USDC"\n  },'],
    ],
  },
  // CJS: schemes
  {
    file: join(NM, 'cjs/schemes/index.js'),
    replacements: [
      ['"skale-base-sepolia"]\n)', '"skale-base-sepolia","arc-testnet"]\n)'],
      ['"skale-base-sepolia"\n  ]', '"skale-base-sepolia",\n    "arc-testnet"\n  ]'],
      ['["skale-base-sepolia", 324705682]\n  ]);', '["skale-base-sepolia", 324705682],\n    ["arc-testnet", 5042002]\n  ]);'],
    ],
  },
  // CJS: types
  {
    file: join(NM, 'cjs/types/index.js'),
    replacements: [
      ['"skale-base-sepolia"]\n)', '"skale-base-sepolia","arc-testnet"]\n)'],
      ['"skale-base-sepolia"\n  ]', '"skale-base-sepolia",\n    "arc-testnet"\n  ]'],
      ['["skale-base-sepolia", 324705682]\n  ]);', '["skale-base-sepolia", 324705682],\n    ["arc-testnet", 5042002]\n  ]);'],
      ['"5042002":', '//"5042002":'], // guard against double-patching config
    ],
  },
]

// CJS files that only need the three network list entries (no config)
const CJS_NETWORK_ONLY = [
  'cjs/shared/index.js',
  'cjs/index.js',
  'cjs/client/index.js',
  'cjs/verify/index.js',
  'cjs/facilitator/index.js',
]

const NETWORK_REPLACEMENTS = [
  ['"skale-base-sepolia"]\n)', '"skale-base-sepolia","arc-testnet"]\n)'],
  ['"skale-base-sepolia"\n  ]', '"skale-base-sepolia",\n    "arc-testnet"\n  ]'],
  ['["skale-base-sepolia", 324705682]\n  ]);', '["skale-base-sepolia", 324705682],\n    ["arc-testnet", 5042002]\n  ]);'],
]

// ESM config patch (add to each CJS file that has config inline)
const CONFIG_PATCH = [
  ['var config = {', 'var config = {\n  "5042002": {\n    usdcAddress: "0x3600000000000000000000000000000000000000",\n    usdcName: "USDC"\n  },'],
]

function patchFile(filePath, replacements) {
  let content = readFileSync(filePath, 'utf8')
  let changed = false
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.replaceAll(from, to)
      changed = true
    }
  }
  if (changed) {
    writeFileSync(filePath, content)
    console.log(`✓ patched ${filePath}`)
  } else {
    console.log(`  skip    ${filePath} (already patched or pattern not found)`)
  }
}

for (const { file, replacements } of PATCHES) {
  try { patchFile(file, replacements) } catch (e) { console.warn(`  warn: ${file}: ${e.message}`) }
}

for (const rel of CJS_NETWORK_ONLY) {
  const file = join(NM, rel)
  try {
    let content = readFileSync(file, 'utf8')
    const hasConfig = content.includes('var config = {')
    const reps = hasConfig ? [...NETWORK_REPLACEMENTS, ...CONFIG_PATCH] : NETWORK_REPLACEMENTS
    patchFile(file, reps)
  } catch (e) { console.warn(`  warn: ${file}: ${e.message}`) }
}

console.log('\nDone. x402 now supports arc-testnet (chain ID 5042002).')
