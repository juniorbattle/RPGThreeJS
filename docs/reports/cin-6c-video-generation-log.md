# CIN-6C video generation log

## Production contract

| Field | Value |
|---|---|
| Baseline | `3470b749c47c04a39092f5beb2974ab09c0ff63c` |
| Census SHA-256 | `b3ee675cccf87630c004ce00ba3c168ac64e8a50d92b6dbf07ed0ab625021c82` |
| Provider | MiniMax Open Platform Direct API |
| Model | `MiniMax-H3` |
| Mode | image-to-video, first-frame conditioned |
| Requested resolution | `2K` |
| Prompt version | `cin6c-p1-v1` |
| Provider scheduling | strictly sequential, one request at a time |
| Selected shots | 11 |
| Provider attempts | 15 |
| Targeted retries | 4 |
| Rejected attempts | 4 |
| Retry ceiling | 3 attempts per shot; respected |
| Provider-reported usage | 4,257,384 tokens; 78 generated seconds |

The API key, authorization header, complete environment, provider response dumps, provider URLs, raw candidates, review frames, and mastering intermediates are not recorded in tracked content. Task IDs and hashes below are non-secret production provenance.

## Attempt ledger

| Runtime ID / attempt | Task ID | Seconds / tokens | Source SHA-256 | Prompt SHA-256 | Raw SHA-256 | Decision |
|---|---:|---:|---|---|---|---|
| `cedric_encounter` / 1 | `440409283993833` | 5 / 273,410 | `343268d7c3e78c8238dad8231a0a7a6fed7ce7c190ed237c37af9df12de4df88` | `36724fc9f6f8b9e3aa1ccf3fb573e60d1669fd9720e7c471c8ff9ffc2d43e337` | `aa44e59b52eb2694e951e308e592cbad7597fa763441fb3eafd5f3b446471f29` | selected |
| `garen_encounter` / 1 | `440410119500029` | 5 / 273,410 | `0da064f44e5068a1c979eb7c97afe6a51cf645c1cb2da36264f09811723414c6` | `68b207b72dfedffa4614d4d9664ddbada9dfdd83eae8bbd713a9ef79156aecd0` | `9a3e0fb536d90f1dc1d96ef48bc00579c0c486650e3e98eaa93a7a47f96b8576` | rejected: excessive lance rotation |
| `garen_encounter` / 2 | `440412645724470` | 5 / 273,410 | `0da064f44e5068a1c979eb7c97afe6a51cf645c1cb2da36264f09811723414c6` | `7684e79153458763c73e1665c71a8d6372f15dfd4bfb66ca9c888cc5a6ff6b0c` | `294b154c358add570429ae1d8942c5d5cdd1b8ca88fbbde10ed761f5d590e9db` | rejected: residual lance drop/rotation |
| `garen_encounter` / 3 | `440413892370686` | 5 / 273,410 | `0da064f44e5068a1c979eb7c97afe6a51cf645c1cb2da36264f09811723414c6` | `0d987c9cc056aa442c3aa56f1575e1e6d9b6ac3e452143982614ee1c3eade8f0` | `554307d1782b187e4b246f29da6377219f175f76b1af7143ebccbc02305a78f7` | selected |
| `serpent_road_tension` / 1 | `440418094518553` | 8 / 429,644 | `071ad103f320eeefa666403f1e706411b5fdafa01a6ad36394572d09a14e5085` | `30baea7ae2eb9033446ef1295b815e2b35b0ae92efebeeb61bff50fdf772a81a` | `992464b821fb688b5efcc5c601017958681b173cc00a4815c1cbab78656ea563` | selected |
| `shrine_reveal_context` / 1 | `440418432049266` | 5 / 273,410 | `87e972b9367d2e926e3ad71efa3454f208223875fad8ea9caebddfd3d888e2a4` | `2622ca6247f39d035eb21c74ed9521d7a505901d86b83b02734977ba391149c0` | `ed945bda2191767a5ea3a4d5584e5549969c979fdedfd2d541ccc1ff566907be` | selected |
| `injured_merchant_encounter` / 1 | `440421741183174` | 5 / 273,410 | `7c2344b07bf4f47c6095dd3ac916a75c38458b8dbbea1c4b313121e3c77691dd` | `ba062fa004fbcfc7b0e7641a9979021fa9365aa0d13598d9b8a267ec8c359254` | `0d3352a262861061b1ba7b27302bf57590dc773675a95cf92b6030a1432f7546` | selected |
| `abandoned_cart_reveal` / 1 | `440422123647193` | 5 / 273,410 | `271aff0df6a47d2d1ad157fb8b59eecdc70832e4435821334f40ee54718a872c` | `fd662ae8de1e9391468097402ece2363bef0be53e869af158225b8b9e586c994` | `903e2e2440f697c636bf6974bfe41c25e135ce6f55c471141d9f90f5020c39da` | selected |
| `spider_nest_reveal` / 1 | `440474176811316` | 5 / 273,410 | `0c1f61869c3fcdcb4273fa3f85bf833a5b77c5cb25a697cfdd00ebb781377400` | `5aea415e8a9d1c6d15d400b40aefab362d96c2602af2c9dee68580ceda7756d6` | `5309d1b053e1b55c1811d4a60c3118674063f3f0921f3a85c8c5daaf3c7da8e6` | selected |
| `troll_crossing_reveal` / 1 | `440476209631467` | 5 / 273,410 | `2199c0c08529e837038d1e1a3ebc8818da4ad930a46fb2baa2ac49caa120b1b9` | `6fc67086de44dc8ecedc8d34912d9591ec86c854977b84d3338e320f2cc7a81a` | `db8c3bc4a8b147dfb1632b288e74968b1d826151b949111aa26a29f2511f2c31` | selected |
| `serpent_duelist_reveal` / 1 | `440477909467430` | 5 / 273,410 | `9c1d5547d6486734ced3f7a3de2be33919ddbf65a7cebdf5bf5cc3191edf05a3` | `e45dfd23e23f153fb2e03baff96c3696f1673ea57c3b0f7078fcd7a2c1ac5d9c` | `4f21d3699a4958b144ed18b92c87a4367f9aacd507b2da20d8fb32f62e86c6da` | selected |
| `young_dragon_encounter` / 1 | `440480702255312` | 5 / 273,410 | `552bf8b3d9d993106696aea48d6d3361f7655400fa1a4084bce2273a241dc978` | `15327b72eb57c41867af4c533fe49dd2cd61eb4cdc1bf137f7bb6f49ef6e0612` | `2d6bff66544462dd2f034ca39cbd9680134be7204aab39c5df086becb1c61307` | selected |
| `serpent_informant_encounter` / 1 | `440481907110115` | 5 / 273,410 | `b1302cba9d77e085dfeea5dcbb279d9910249e2ecfd747628cee83ef5eebc134` | `8ed819ac72219147db5f5e057ac310f3c4eb4283c03dbee147c1497a44162659` | `94d16f7273260d91045a1fd9baa8a52a019c5af999ebf90b4351f5329ce604bc` | rejected: background silhouettes multiply and approach |
| `serpent_informant_encounter` / 2 | `440483922292845` | 5 / 273,410 | `b1302cba9d77e085dfeea5dcbb279d9910249e2ecfd747628cee83ef5eebc134` | `22618a3c98b2e43dcc8b49cc4bcf94514a4db7d36508ba9504681eb16f2a33b7` | `0dd6c58cc8ab3fabaeca42428927c69c90d92d0a30e5fc2c3bd017223c7464c5` | selected: most restrained patrol motion |
| `serpent_informant_encounter` / 3 | `440487563985154` | 5 / 273,410 | `b1302cba9d77e085dfeea5dcbb279d9910249e2ecfd747628cee83ef5eebc134` | `aef03e33eedc735286fbb57615541fce66dc671867f1df33314060c07e0712b4` | `3257de0073a0fcfc70b90c7ded316f023af5d1bbc7272d18d5e843bf3903bfed` | rejected: road group advances too clearly |

## Mastering and promotion

Each selected candidate was normalized through the existing offline CIN-4 mastering path. No generated audio was retained and no arbitrary second compression pass was applied.

| Runtime ID | Selected attempt | Final bytes | Final SHA-256 |
|---|---:|---:|---|
| `cedric_encounter` | 1 | 3,519,379 | `aa41a28e8b8829eb9c1c4122184ace9756f01676c2bbc903899e2f366e819a82` |
| `garen_encounter` | 3 | 3,497,854 | `2d9bb62eba5bc8c17a84beebe81ffd916d805a9063398054d424865fff5646a7` |
| `serpent_road_tension` | 1 | 11,761,479 | `33be67338637de8413738789b8a0fa067007ff65bae06081b229870817f56412` |
| `shrine_reveal_context` | 1 | 2,380,010 | `e28a9ceb996e16291594f99e2905b25da35b316b0aafe1c058dfe5818d09f48c` |
| `injured_merchant_encounter` | 1 | 3,199,828 | `a1e6de8c63d1d83d5ee51c5de6548a62b068392fdcd746a948f231d253405892` |
| `abandoned_cart_reveal` | 1 | 5,125,482 | `535b70307fa5aebadd846dc91f1bbcebbc8ad8f845c7c4d61823808def7a57f8` |
| `spider_nest_reveal` | 1 | 7,437,452 | `7f98991ba6ae91f7904355736875d822c70b5af48ebeeef64598730405e57b0b` |
| `troll_crossing_reveal` | 1 | 6,689,991 | `6ddb0044b5259870bbad78d31a57ab77dc7d47268310514ef8d7e00a2a6d3281` |
| `serpent_duelist_reveal` | 1 | 7,880,492 | `9bf2e927a0940b5b0b3d116a7dbb692bf00c1371b19fa985f154bf08527c2560` |
| `young_dragon_encounter` | 1 | 7,945,209 | `a9cf74c8372981aeb7afdde9efa2a8e5222284fe098b6be5f03223d2d22bdc91` |
| `serpent_informant_encounter` | 2 | 2,183,944 | `5a1a79ed2c9c07f1da13aa2ed872be8823de7223324dba6faa2c7dc60507c069` |

All production copies match their mastered source hashes. The manifest contains exactly one local descriptor for each runtime ID and no production placeholder.

## Visual acceptance

| Runtime ID | Identity | Facing | Anatomy | Scale | Grounding | Perspective | Environment | Motion | Final frame | Truth safe |
|---|---|---|---|---|---|---|---|---|---|---|
| `cedric_encounter` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `garen_encounter` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `serpent_road_tension` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `shrine_reveal_context` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `injured_merchant_encounter` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `abandoned_cart_reveal` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `spider_nest_reveal` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `troll_crossing_reveal` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `serpent_duelist_reveal` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `young_dragon_encounter` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `serpent_informant_encounter` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

Every master also passes MP4 container, H.264 High profile, yuv420p, 1920x1080, square pixels, 16:9, 24 fps, silence, zero rotation, duration, decode, nonblack/nonblank final-frame, and real Chromium playback gates.

