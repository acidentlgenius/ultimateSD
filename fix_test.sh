sed -i "s/import {/import * as launchOffer from '..\/launch-offer';\nimport {/g" ultimate-sd/src/lib/__tests__/launch-offer-grant.test.ts
sed -i "s/describe('claimPlatformLaunchOffer', () => {/describe('claimPlatformLaunchOffer', () => {\n  beforeEach(() => {\n    vi.spyOn(launchOffer, 'isLaunchOfferActive').mockReturnValue(true);\n  });/g" ultimate-sd/src/lib/__tests__/launch-offer-grant.test.ts
