<script setup lang="ts">
import accentSpark from '../assets/calendar/08bc0911-cd39-458a-8e13-ab15cb943d81.svg'
// Original Figma vector layers. Interactive controls are provided by CalendarView.
import asset0 from '../assets/calendar/dd93f18d-cdec-4add-847f-e4d9f9ed59e9.svg'
import asset1 from '../assets/calendar/b315bb73-c4b6-4bb5-bc94-073c0708ba4a.svg'
import asset2 from '../assets/calendar/b65bc5b2-2951-4e42-9f3a-2b430ce464f6.svg'
import asset3 from '../assets/calendar/d9c56c04-01d1-44c7-82c9-274feafee261.svg'
import asset4 from '../assets/calendar/44e1156e-5780-4df7-9b55-db4f4ec9ba5c.svg'
import asset5 from '../assets/calendar/1ec58a95-45b7-46ff-9e9b-2af785c13dff.svg'
import asset6 from '../assets/calendar/9a75a521-129c-4605-8aac-8008d6aea2de.svg'
import asset7 from '../assets/calendar/e3134bcf-411d-4938-a207-bb8c8372d060.svg'
import asset8 from '../assets/calendar/4b257f58-6656-4f15-a5fc-c6f5a4df293b.svg'
import asset9 from '../assets/calendar/66d4a818-5417-4c1c-ac45-147152fb77f1.svg'
import asset10 from '../assets/calendar/ba47c30b-0860-4270-b8f7-d72ff2f6a2b6.svg'
import asset11 from '../assets/calendar/fb6eed88-856b-49a9-8b4b-135281954980.svg'
import asset12 from '../assets/calendar/5e929305-14cc-4c7e-b15c-88ab39f775ff.svg'
import asset13 from '../assets/calendar/7ff83ef7-96b0-4a2f-8b3e-d975d90e8b02.svg'
import asset14 from '../assets/calendar/411be528-dba9-4de9-addb-406232bee064.svg'
import asset15 from '../assets/calendar/be3c7010-44cc-44ef-a778-90b223d6fdd7.svg'
import asset16 from '../assets/calendar/2c2c774d-e39f-4325-a179-bd18a53b9966.svg'
import asset17 from '../assets/calendar/0b1c1bca-21d4-457e-923b-451b4ee96792.svg'
import asset18 from '../assets/calendar/f0767369-764b-4436-970d-48a05c362c14.svg'
import asset19 from '../assets/calendar/26ba1479-a1a4-42c6-b789-854920285ec0.svg'
import asset20 from '../assets/calendar/24cd4ad5-af34-4af0-9c77-f6f025fd1ea6.svg'
import asset21 from '../assets/calendar/78e9cbd9-a8ef-4f98-be21-0804778cf0ee.svg'
import asset22 from '../assets/calendar/828c3654-fb10-4e7e-b0fc-c1d031f8dbbb.svg'
import asset23 from '../assets/calendar/fa285b24-689f-4b16-9077-29932eaa98b5.svg'
import asset24 from '../assets/calendar/44a9cabf-d1f4-4a43-a58b-76f2b36b91ae.svg'
import asset25 from '../assets/calendar/f2bf787e-11a7-4a90-831a-0b45b9ae2be0.svg'
import asset26 from '../assets/calendar/34b3d767-28ed-45a7-821f-3db17ad44060.svg'
import asset27 from '../assets/calendar/6a1a823b-609c-4093-a7db-ca60445082fb.svg'
import asset28 from '../assets/calendar/1da5060b-32e2-4a2b-acf3-d7e19bbb1586.svg'
import asset29 from '../assets/calendar/5e7ac857-5898-43c6-85d6-07cf8df879b7.svg'
import asset30 from '../assets/calendar/32d532f9-e53b-4c56-b401-3a630d8ef09d.svg'
import asset31 from '../assets/calendar/aa203201-4b96-4274-ad19-fb356b32d9d1.svg'
import asset32 from '../assets/calendar/466e01c3-c535-40f6-a716-0456dc9a99ba.svg'
import asset33 from '../assets/calendar/56ffb8f8-b93f-415d-925b-43024f2b75cb.svg'
import asset34 from '../assets/calendar/3cd963d6-e080-4590-8c82-5fb106ab736a.svg'
import asset35 from '../assets/calendar/a225f93b-c94f-48d7-87c5-78066b37d5e3.svg'
import asset36 from '../assets/calendar/97961b17-18a4-4a27-acc6-452f7f2b9aaa.svg'
import asset37 from '../assets/calendar/8738fd43-517a-41f8-972b-25403159f14d.svg'
import asset38 from '../assets/calendar/cf8779d6-6148-4bf4-abf8-fd30df566415.svg'
import asset39 from '../assets/calendar/19380a57-ebb6-4d99-b39d-764c2d268621.svg'
import asset40 from '../assets/calendar/5d35b892-c989-479a-a934-af308479fabd.svg'
import asset41 from '../assets/calendar/43ba3eab-8c72-4dec-9364-e867c9a2ce99.svg'
import asset42 from '../assets/calendar/e752a27a-1229-4543-9c54-973d67dab892.svg'
import asset43 from '../assets/calendar/c11fa0a1-feb3-45be-97a2-364cdb489bd4.svg'
import asset44 from '../assets/calendar/d01c786a-faf7-4e21-aa8d-9205f6e96528.svg'
import asset45 from '../assets/calendar/f4577d37-a6fa-4542-b6a7-e2b837f4998b.svg'
import asset46 from '../assets/calendar/a64a7642-8996-47ab-bc2a-9fcd377f4b53.svg'
import asset47 from '../assets/calendar/b5719dee-cd0e-4bb6-b9c1-1209df57c011.svg'
import asset48 from '../assets/calendar/0823356d-a604-4589-ac92-1dc7ccd53119.svg'
import asset49 from '../assets/calendar/319754c9-ec80-4179-b63f-425a664dbf25.svg'
import asset50 from '../assets/calendar/b5826cbd-d5f7-4b4f-8ba6-119b00269ce7.svg'
import asset51 from '../assets/calendar/8ea37cd9-3b8c-4a73-8189-742d8649be6a.svg'
import asset52 from '../assets/calendar/9048f90c-bc83-4b1e-a7f3-510a0b0c4ec6.svg'
import asset53 from '../assets/calendar/ceeb7297-c0e9-44dc-9aa4-03aa6f57a353.svg'
import asset54 from '../assets/calendar/09e4874c-353e-438d-8860-d5519fb2c670.svg'
import asset55 from '../assets/calendar/76576d54-7eb1-40a2-ab26-e9dba393da54.svg'
import asset56 from '../assets/calendar/e4191e80-f751-4b67-86b0-585398fd3544.svg'
import asset57 from '../assets/calendar/b3abc66a-a008-4f86-8f6f-3b718a8b6f00.svg'
import asset58 from '../assets/calendar/1d8e1fcc-f02c-40bf-80c4-2809d0a5576f.svg'
import asset59 from '../assets/calendar/9b71f2a5-375e-420d-a982-6b10213ac638.svg'
import asset60 from '../assets/calendar/7e8947cd-d534-4d2d-86eb-cb6361dad1a4.svg'
import asset61 from '../assets/calendar/389970af-9d13-4d81-b403-cf40285f38b6.svg'
import asset62 from '../assets/calendar/28fb60de-e8d5-4f85-8caf-8cebce17e772.svg'
import asset63 from '../assets/calendar/30e3dafc-ca5c-4be1-9398-c6ad7227d9fd.svg'
import asset64 from '../assets/calendar/19c38d84-0f09-4868-8bb8-034b59e48b7b.svg'
import asset65 from '../assets/calendar/5c1e3381-d5cd-416e-b9d0-5403eb32c0d0.svg'
import asset66 from '../assets/calendar/7ee7783a-d786-4612-8ae3-c53a71acf68c.svg'
import asset67 from '../assets/calendar/00209f02-8cd3-4fec-85bf-c0dc8c8d484f.svg'
import asset68 from '../assets/calendar/36a55742-88c7-4f6c-8d04-7bee2e86f080.svg'
import asset69 from '../assets/calendar/77383b28-ec83-42a3-9114-1dbb672cfd10.svg'
import asset70 from '../assets/calendar/dd4a46ec-689c-4ab5-992f-ba0f4318400f.svg'
import asset71 from '../assets/calendar/a992b791-f7cd-4bc9-bf7e-acc4b03f6d40.svg'
import asset72 from '../assets/calendar/83337893-a4e3-422c-8e24-841835e0c775.svg'
import asset73 from '../assets/calendar/14e9564e-70f6-4c30-8309-7a14e58b5691.svg'
import asset74 from '../assets/calendar/da87e11a-e1e5-419b-aa67-ae3e8a114300.svg'
import asset75 from '../assets/calendar/60ff1c75-83ee-4b1a-b4e3-ded5eb62da83.svg'
import asset76 from '../assets/calendar/01168841-54b7-4aee-a6fe-f79817f4fc59.svg'
import asset77 from '../assets/calendar/cf4ed22f-566a-442f-97f1-f3dd8c06dd5b.svg'
import asset78 from '../assets/calendar/dbf425a5-42ee-4496-8a0a-36e0d493d3b5.svg'
import asset79 from '../assets/calendar/9ba8fbd7-0b57-4c3a-af27-b5cde7bf4de3.svg'
import asset80 from '../assets/calendar/c836dd01-a648-4e2c-abca-a0dd8fc54bdf.svg'
import asset81 from '../assets/calendar/3e85f60e-9873-4c02-ab1c-69277aeb1a9a.svg'
import asset82 from '../assets/calendar/a6ea3183-4bc7-4465-ada3-17691c0d994d.svg'
import asset83 from '../assets/calendar/8514dc77-2fc6-4d61-9f95-c9cd76599188.svg'
import asset84 from '../assets/calendar/8ec9f337-5cda-48c8-bd81-426e3c29ea3c.svg'
import asset85 from '../assets/calendar/2aad8398-bc28-4637-8f6b-4c9b7f65f359.svg'
import asset86 from '../assets/calendar/e1e1186d-614a-43dc-988e-11ac2e4a04ea.svg'
import asset87 from '../assets/calendar/e2f3f2f7-0a70-46cb-9d77-087cf6d4cb94.svg'
import asset88 from '../assets/calendar/3dd3d7c3-0094-419a-a416-6ac2799f73d1.svg'
import asset89 from '../assets/calendar/b9386bd9-e27c-41f2-8c1f-194d408fe688.svg'
import asset90 from '../assets/calendar/f375be89-03c0-40c2-9d39-4922065921a2.svg'
import asset91 from '../assets/calendar/25d99b88-038b-4b8b-9a8c-34d8d5055e1f.svg'
import asset92 from '../assets/calendar/b7385684-4467-4015-bbd9-63d700a69966.svg'
import asset93 from '../assets/calendar/59bf912d-4f48-4c3b-94d2-5b8611385063.svg'
import asset94 from '../assets/calendar/23a7313c-7392-4b40-9f36-17aa1899545e.svg'
import asset95 from '../assets/calendar/9d1264b5-f91c-438d-bd50-58b6532b4903.svg'
import asset96 from '../assets/calendar/ba2e8214-2c8f-43be-9fde-70c2ad27d857.svg'
import asset97 from '../assets/calendar/c6bd47d7-ce68-4196-a9fb-161c5a867017.svg'
import asset98 from '../assets/calendar/811c65af-6843-46d3-9e1f-50bc3d404d10.svg'
import asset99 from '../assets/calendar/5850c4e2-8af2-4df4-b20f-69f9d9cc12c0.svg'
import asset100 from '../assets/calendar/3c26ed02-dad1-4631-926a-574851e31209.svg'
import asset101 from '../assets/calendar/fd428171-06ef-4cd1-b9e3-ac7be4104b5e.svg'
import asset102 from '../assets/calendar/bbae1659-9cfa-48e9-97e4-063ce34d4bc4.svg'
import asset103 from '../assets/calendar/5bac05df-55c3-4225-b1f4-19f3df0b104b.svg'
import asset104 from '../assets/calendar/fce4f2bb-d03d-49b7-b32d-e3b43f0781be.svg'
import asset105 from '../assets/calendar/f3df0af7-3219-4de1-975a-b59ba004ea2f.svg'
import asset106 from '../assets/calendar/6ebb9c5a-3bd9-4880-b3b7-6015fc89b37e.svg'
import asset107 from '../assets/calendar/2e27dfe0-1c02-4af3-8169-379ea4ce1e15.svg'
import asset108 from '../assets/calendar/f1b5aea2-027e-4fc7-b2d3-8f303bfdf97c.svg'
import asset109 from '../assets/calendar/a9ac8350-b766-4f6e-9514-c27a92da419b.svg'
import asset110 from '../assets/calendar/12e05249-a9ee-46ce-80bd-19f19a85e917.svg'
import asset111 from '../assets/calendar/02a959d6-8a3e-437e-bdf5-aff62458828e.svg'
import asset112 from '../assets/calendar/89662413-b95d-4005-84ad-d7a7e081db60.svg'
import asset113 from '../assets/calendar/5fc4d021-3f15-468e-b070-2c372db8dc5c.svg'
import asset114 from '../assets/calendar/1a7d69bc-8450-4552-88d9-fed61a50cf56.svg'
import asset115 from '../assets/calendar/9385bb96-9722-430e-a5b9-f0fca00f0bdd.svg'
import asset116 from '../assets/calendar/c30586bc-7622-4d68-9fd6-f5f803dc557d.svg'
import asset117 from '../assets/calendar/39d1eaab-3bfd-4f0f-9423-6cc1ff61c716.svg'
import asset118 from '../assets/calendar/d23f13ac-f0bf-4aac-864a-f3b6b8e2a77d.svg'
import asset119 from '../assets/calendar/a2c2f866-8a91-4f8b-87d1-a0afaeb7c988.svg'
import asset120 from '../assets/calendar/40b40833-11e8-4cf6-9b94-c6bbd310bd8c.svg'
import asset121 from '../assets/calendar/be3a6d5f-9887-46ef-b5a9-23387dc67014.svg'
import asset122 from '../assets/calendar/2f9a9faa-fba0-49bd-af9b-fb89f5988f6d.svg'
import asset123 from '../assets/calendar/8f3e7ae6-a270-450e-9dbf-dbad3df05cd7.svg'
import asset124 from '../assets/calendar/ea465698-73d8-458c-8a4b-3ea657290857.svg'
import asset125 from '../assets/calendar/bad3d533-56fb-4f3d-8934-748c4229ce64.svg'
import asset126 from '../assets/calendar/380e1abf-6cdb-4c11-87ef-3043d2039f1f.svg'
import asset127 from '../assets/calendar/82462d8c-d891-41b9-933d-82674492b07a.svg'
import asset128 from '../assets/calendar/05b023ce-f3ae-4631-814c-aaa7d64f959c.svg'
import asset129 from '../assets/calendar/b9eaa83f-d8d9-40ad-bbbd-201467b03a90.svg'
import asset130 from '../assets/calendar/3c025e41-cf80-49bd-be53-69db2ed025f8.svg'
import asset131 from '../assets/calendar/c178c89b-c1f2-46af-9206-6ea5c673e306.svg'
import asset132 from '../assets/calendar/93089d16-3672-41d0-bd13-76643aa82264.svg'
import asset133 from '../assets/calendar/8dd66335-4d2a-4e83-ad59-b16615088149.svg'
import asset134 from '../assets/calendar/29424a35-deb0-4499-b3af-65131d58ab73.svg'
import asset135 from '../assets/calendar/cc13a7b0-5d23-4549-9ca6-2107f5c2bd5f.svg'
import asset136 from '../assets/calendar/e61f8d9d-a502-43c1-910d-e773fe9b7cf8.svg'
import asset137 from '../assets/calendar/9e153efe-5492-435c-9333-3b8233434e76.svg'
import asset138 from '../assets/calendar/123196ef-b710-4efb-9fcc-eb7ee8a93c18.svg'
import asset139 from '../assets/calendar/9c2651e7-82ce-4acb-bbbb-50f1b96e9e28.svg'
import asset140 from '../assets/calendar/7b4d12bd-2728-43e9-bea1-330e735c37c5.svg'
import asset141 from '../assets/calendar/df16b377-7d6a-4126-b3db-65ec99370132.svg'
import asset142 from '../assets/calendar/e6dc781b-3492-4439-94c5-0c9c28d4fa33.svg'
import asset143 from '../assets/calendar/c26fb971-eb46-4dc6-b5a9-c9dd472683de.svg'
import asset144 from '../assets/calendar/7eb3182b-11d5-4a5a-a479-2ca535ce5e45.svg'
import asset145 from '../assets/calendar/57569b80-00b6-4f4d-9ebd-785c764737f4.svg'
import asset146 from '../assets/calendar/1ff9a73b-382a-4a48-be84-f4134bc05f4d.svg'
import asset147 from '../assets/calendar/66f706af-3b6e-4d6e-9d1f-da19ba695ab3.svg'
import asset148 from '../assets/calendar/d911600d-98e5-4f20-b1bf-11cb4e06ee7c.svg'
import asset149 from '../assets/calendar/0871c4ad-a16b-4d9c-a1cd-1b5ce04df97e.svg'
import asset150 from '../assets/calendar/92603777-5c95-4a43-a915-c154b059a0e4.svg'
import asset151 from '../assets/calendar/c501d637-cd94-4c92-8872-d62469c1243c.svg'
import asset152 from '../assets/calendar/4e378e60-ae0f-48ee-96a3-1c4d548f04a6.svg'
import asset153 from '../assets/calendar/ca4e8dc8-b4d6-4d4c-bf8a-70b18b0e09d3.svg'
import asset154 from '../assets/calendar/6bd468a1-c736-46ac-93e8-556e90f9ff08.svg'
import asset155 from '../assets/calendar/dd293228-8aeb-49c0-82df-b01501876ac5.svg'
import asset156 from '../assets/calendar/3ab5855b-eba7-4819-a863-4c7080fd16a8.svg'
import asset157 from '../assets/calendar/78d83be2-83ea-44b4-9d2e-efd162e88c04.svg'
import asset158 from '../assets/calendar/e6102961-0829-435a-b6e6-987bbffd6f3a.svg'
import asset159 from '../assets/calendar/099eaa53-04cc-4dcf-b450-bcd03aedecfc.svg'
import asset160 from '../assets/calendar/9edbc3d5-5678-452a-8485-c433efdb4ec7.svg'
import asset161 from '../assets/calendar/a41b4ccf-7d65-4992-95fe-4dfd3e01fb2b.svg'
import asset162 from '../assets/calendar/0ca3412d-f262-464f-8396-885994f9051a.svg'
import asset163 from '../assets/calendar/4b54716e-5d1e-468a-a0cb-4ed337cf4d5b.svg'
import asset164 from '../assets/calendar/7fb6af66-e9d5-4fbd-b01c-b8b5160c9bd2.svg'
import asset165 from '../assets/calendar/c63d0ed0-31a6-4bd9-8558-fe0cf3f66da8.svg'
import asset166 from '../assets/calendar/f0652042-6e86-4c99-a099-5c77897437fd.svg'
import asset167 from '../assets/calendar/33233f1b-6512-4d8b-ad05-d7c823914a30.svg'
import asset168 from '../assets/calendar/0ea0bd3f-fff4-47c2-96de-c778aa9b514c.svg'
import asset169 from '../assets/calendar/a2608747-321b-4e78-ac19-1f46ac0903a5.svg'
import asset170 from '../assets/calendar/c5568fbf-d62e-4115-a4da-4cdd05ee27c9.svg'
import asset171 from '../assets/calendar/91b29698-f679-400d-b783-8d7a1e5f3cf0.svg'
import asset172 from '../assets/calendar/05a708b6-f94e-48b1-b90c-d6f270bdb441.svg'
import asset173 from '../assets/calendar/17934e0c-37df-4560-a3b1-2765e19fc960.svg'
import asset174 from '../assets/calendar/392a3f8c-7442-4243-ae13-3eb6a6bc5fa5.svg'
import asset175 from '../assets/calendar/eb963737-0779-458b-9841-0853b16d5c2f.svg'
import asset176 from '../assets/calendar/f9832e0c-ecfa-47dd-97bb-13ec30732316.svg'
import asset177 from '../assets/calendar/c9b167a4-2974-43b1-8e4a-ce9517ef2669.svg'
import asset178 from '../assets/calendar/f4d763a3-b5d5-4b7b-9177-76d9712b5ab7.svg'
import asset179 from '../assets/calendar/ee9361e4-1cc5-4ba0-908b-177ef3f6b3e8.svg'
import asset180 from '../assets/calendar/f502dd64-0382-4f77-a4fe-68f94697eafc.svg'
import asset181 from '../assets/calendar/4b929c05-3819-4523-910c-8a14d1b4c1e3.svg'
import asset182 from '../assets/calendar/c3f920ea-89ff-452a-84da-1e9066796eb0.svg'
import asset183 from '../assets/calendar/15d14e67-d6af-4ab6-adce-77f731b7ad20.svg'
import asset184 from '../assets/calendar/4c29ddfd-9262-4de5-9cda-fbb04d11cc90.svg'
import asset185 from '../assets/calendar/dda8d933-5b1d-4a26-916e-2cd53fdcdd29.svg'
import asset186 from '../assets/calendar/fe6a6c8f-f3c7-42db-9768-43dc7182fc76.svg'
import asset187 from '../assets/calendar/79e6dcfe-5bdc-4b7c-8843-7882a85e3e0f.svg'
import asset188 from '../assets/calendar/f456c830-6f12-4e94-9533-27a499868e16.svg'
import asset189 from '../assets/calendar/a3da2388-84f8-4c0d-ba9c-f6dcba0698b0.svg'
import asset190 from '../assets/calendar/971dd79a-547c-4cf8-9225-94bf64a97c52.svg'
import asset191 from '../assets/calendar/aa2fca97-cfcb-4eee-8998-2ea60ce5715c.svg'
import asset192 from '../assets/calendar/94e93241-c991-4c77-ae47-b4acb51ba31f.svg'
import asset193 from '../assets/calendar/337d787d-faa7-4e35-b1b8-ac898cc3b4a5.svg'
import asset194 from '../assets/calendar/2c2b068c-64e4-42c5-8d8b-8a7175d2c0bd.svg'
import asset195 from '../assets/calendar/c9b8cf81-8eb9-413f-846e-8e909c1e23d9.svg'
import asset196 from '../assets/calendar/7a14eecd-9671-4745-8859-5afd55d258fb.svg'
import asset197 from '../assets/calendar/8edebef0-99c8-4edf-8da4-95554706f232.svg'
import asset198 from '../assets/calendar/8284b362-b836-43c4-973b-b97ec2440ca0.svg'
import asset199 from '../assets/calendar/ab197b06-7da6-49a4-a5fc-24adf797aa0a.svg'
import asset200 from '../assets/calendar/614f0480-84b2-4389-b8de-22921dddcdf6.svg'
import asset201 from '../assets/calendar/0ebba4b9-c055-441d-af31-80092c8eafb0.svg'
import asset202 from '../assets/calendar/ac411480-2408-4d41-b86b-78d32950abae.svg'
import asset203 from '../assets/calendar/b062207a-12b3-4a04-a724-73cd3fbc3107.svg'
import asset204 from '../assets/calendar/2b17a370-beba-4b13-9bf8-8de642435fb9.svg'
import asset205 from '../assets/calendar/024931cb-14b1-4e63-b7a7-b4e5ddb08c7c.svg'
import asset206 from '../assets/calendar/7beafe68-f1f9-4b44-8a7f-4a4c6d3d308a.svg'
import asset207 from '../assets/calendar/cb685ee6-9e74-48a0-b3dc-a78583516b19.svg'
import asset208 from '../assets/calendar/92296a55-3af5-470d-9ece-f18a895a8a12.svg'
import asset209 from '../assets/calendar/36227458-0c18-46bb-87f8-aa313639c701.svg'
import asset210 from '../assets/calendar/64abdecd-70ec-4c7c-8119-defc32f948d1.svg'
import asset211 from '../assets/calendar/98043340-89c7-49e5-b80b-0e0370b09d00.svg'
import asset212 from '../assets/calendar/bcf3f550-e442-439b-a9eb-ebed79198fd2.svg'
import asset213 from '../assets/calendar/89203290-438e-4584-b314-058316e67f0f.svg'
import asset214 from '../assets/calendar/9e182966-bff2-44e9-b61d-35900df74082.svg'
import asset215 from '../assets/calendar/917cd637-0f21-4337-922a-c0630b38ac72.svg'
import asset216 from '../assets/calendar/04f23b35-7911-4344-9be2-a98624312601.svg'
import asset217 from '../assets/calendar/38537b8f-ce77-423d-8ef3-2281c9759b94.svg'
import asset218 from '../assets/calendar/3d458a5c-2b3b-4053-b7ea-299a6e888e06.svg'
import asset219 from '../assets/calendar/0ffd02f6-5747-47e4-9090-a189790cb638.svg'
import asset220 from '../assets/calendar/5c875a59-f461-4425-87e8-426901d96080.svg'
import asset221 from '../assets/calendar/4950b67b-ce6a-4a4e-8e06-7e0244708c20.svg'
import asset222 from '../assets/calendar/ed119910-bded-445e-934d-84711c1532a5.svg'
import asset223 from '../assets/calendar/4b8c6025-f2db-4a0a-ab5f-a1c9bb758c22.svg'
import asset224 from '../assets/calendar/4123ef78-566e-4170-96e0-28bd537dbd8e.svg'
import asset225 from '../assets/calendar/b7a4803f-7f9c-47d8-94a1-51b194e39510.svg'
import asset226 from '../assets/calendar/9968dfc2-af0a-4561-a7c8-733ca0d58e9a.svg'
import asset227 from '../assets/calendar/e21c9a40-c884-46f2-b206-2b70d60fa67e.svg'
import asset228 from '../assets/calendar/27986d4e-cb49-4488-9858-7c4f41d11841.svg'
import asset229 from '../assets/calendar/0d6edc14-fe42-43b4-b55d-aef1d579bda7.svg'
import asset230 from '../assets/calendar/0448cff1-2f54-4932-90bc-8b560d960b0d.svg'
import asset231 from '../assets/calendar/523bbfed-3849-452c-85ee-6b656652917c.svg'
import asset232 from '../assets/calendar/ceb00053-9840-4a23-bcd9-13f3b97e984c.svg'
import asset233 from '../assets/calendar/be8ff742-3de4-4892-88f6-6467bd479f9d.svg'
import asset234 from '../assets/calendar/e9d06a9f-1489-4811-90cf-f9e583bf2cc2.svg'
import asset235 from '../assets/calendar/bc4d30e6-01a8-404b-92b1-3c592e6fe568.svg'
import asset236 from '../assets/calendar/6cb081e2-99ea-407d-bff2-54564d1c6861.svg'
import asset237 from '../assets/calendar/22648444-a4c0-47fd-8cfa-6010a7b788da.svg'
import asset238 from '../assets/calendar/37b21bdf-faf4-4028-aff3-f9949c11305e.svg'
import asset239 from '../assets/calendar/b2b10ef4-4652-4570-896c-e86241fbdd11.svg'
import asset240 from '../assets/calendar/aaf1d874-5148-49e5-8dcb-5b49a94a466a.svg'
import asset241 from '../assets/calendar/a6c1c62a-02c9-4314-b5e7-dae0c9c11dee.svg'
import asset242 from '../assets/calendar/243f4d65-f0d9-4207-96e3-cbfdaa3eb983.svg'
import asset243 from '../assets/calendar/ef33ae93-f40e-4f3f-aed1-45acd564ae2b.svg'
import asset244 from '../assets/calendar/3effeff1-eea9-4db9-8bcc-3d0e87f0591d.svg'
import asset245 from '../assets/calendar/e08d21fe-b324-49eb-b68b-813c9dc2c6d1.svg'
import asset246 from '../assets/calendar/4635edd5-d398-48e7-9c58-54d3b86d1506.svg'
import asset247 from '../assets/calendar/97de38ce-3185-4d38-a522-b13c49fa0566.svg'
import asset248 from '../assets/calendar/a9436ae3-fcec-4193-a948-b0da5a8c9d34.svg'
import asset249 from '../assets/calendar/d74094ad-6bcc-4b52-951c-04e81db69115.svg'
import asset250 from '../assets/calendar/e2257c22-4b9d-4ed1-b9e3-b81ea65dd2ed.svg'
import asset251 from '../assets/calendar/111cfebd-5a9c-46a5-b64a-00ae0f9d6008.svg'
import asset252 from '../assets/calendar/be5438cd-524f-4875-93dd-15586a49570b.svg'
import asset253 from '../assets/calendar/c8c47eb4-59e8-4cde-b5a8-518711801edb.svg'
import asset254 from '../assets/calendar/cfabffde-633d-4e8f-800c-6f8d4ad94fc8.svg'
import asset255 from '../assets/calendar/ace93455-0209-490e-a868-f984a96d7d09.svg'
import asset256 from '../assets/calendar/40962ceb-81dc-4a6b-877f-8504f8ce54f6.png'
import asset257 from '../assets/calendar/9636d32c-5aa4-4113-b591-1c7818b77d97.svg'
import asset258 from '../assets/calendar/9592defe-f019-409c-a4d8-1de1cc02b75c.svg'
import asset259 from '../assets/calendar/03ecd471-56d2-4093-8087-7d1e6f9e6229.svg'
import asset260 from '../assets/calendar/c64b651a-08cb-47a8-932c-8148858d3cdf.svg'
import asset261 from '../assets/calendar/0683a78c-848c-41b5-8873-c057b8c7b724.svg'
import asset262 from '../assets/calendar/b13fc6d8-2e87-43be-81d4-3edcfe22ed86.svg'
import asset263 from '../assets/calendar/cd52e57e-7920-4a21-bb0d-1c5444e40c5f.svg'
import asset264 from '../assets/calendar/0698ce9e-e4ee-48d8-ba0a-22093411bcec.svg'
import asset265 from '../assets/calendar/70eb315c-dafa-4f3f-b5e4-527584da823d.svg'
import asset266 from '../assets/calendar/c5da1c3f-4d30-4a5a-851a-a4ad1c58b34d.svg'
import asset267 from '../assets/calendar/2826a325-cb3b-4589-bcbc-75d501a652b3.svg'
import asset268 from '../assets/calendar/39760fb1-3cfe-45c1-babc-ead5e1f7401c.svg'
import asset269 from '../assets/calendar/ffeabf1f-5484-4bec-b69b-dddd4f13a70a.svg'
import asset270 from '../assets/calendar/d06765a8-d5c9-4dc8-8678-a5e0499d3971.svg'
import asset271 from '../assets/calendar/0c4736de-a5ca-4035-90e1-1d162e9b866d.svg'
import asset272 from '../assets/calendar/a0da68e2-63d0-4566-a81f-5ce4a73b4ae8.svg'
import asset273 from '../assets/calendar/a5b142c7-5b11-42b2-a989-e42107f51ef6.svg'
import asset274 from '../assets/calendar/0a83a960-613f-4985-bcab-c15e144a215e.svg'
import asset275 from '../assets/calendar/2772f6f4-ff1e-4ab5-8af7-7cbbaab0fe3f.svg'
import asset276 from '../assets/calendar/d439a56e-1eb1-44c9-b7b2-4820166ddc12.svg'
import asset277 from '../assets/calendar/e690ec9e-00d3-4638-9cbd-0d467dcac5ae.svg'
import asset278 from '../assets/calendar/70293ebc-add0-43af-9085-3461871b40d7.svg'
import asset279 from '../assets/calendar/ca2744c2-6407-456f-ad70-25d0efbef658.svg'
import asset280 from '../assets/calendar/73cbe384-c575-496c-8fa2-12cc882de1cb.svg'
import asset281 from '../assets/calendar/c7bd0e62-4491-4f44-aaca-b3b5a1aab3c4.svg'
import asset282 from '../assets/calendar/9667db65-5b49-4327-9569-15cb23fb26e9.svg'
import asset283 from '../assets/calendar/ce00e50e-dea0-4cf7-9b8b-affa8633d9f7.svg'
import asset284 from '../assets/calendar/ba17e785-1d5a-4f2f-8712-54aada4fa630.svg'
import asset285 from '../assets/calendar/b5141d13-0978-4b48-b77a-c4994ea0d5de.svg'
import asset286 from '../assets/calendar/1eb44442-4689-4566-a8a5-8fae036b676d.svg'
import asset287 from '../assets/calendar/aaac809a-d824-44e5-8292-16b781e942d4.svg'
import asset288 from '../assets/calendar/e3033285-1d61-434a-9bb9-a1a671e2b7d2.svg'
import asset289 from '../assets/calendar/297e4867-18d8-4896-b804-70509edc223d.svg'
import asset290 from '../assets/calendar/e340a26b-e55d-4202-a76f-bf1946ca4e02.svg'
import asset291 from '../assets/calendar/9d9256dd-6943-4cc8-9984-1855d550711a.svg'
import asset292 from '../assets/calendar/a402a12c-e904-4bd7-acd4-16a9f0e10565.svg'
import asset293 from '../assets/calendar/0e5f076b-86d8-415f-8442-ae098272a682.svg'
import asset294 from '../assets/calendar/a9bd1e94-cf0c-41c1-9913-caf4a1604ad7.svg'
import asset295 from '../assets/calendar/b9069ed8-954a-49a1-b91f-c0aa6d0dff23.svg'
import asset296 from '../assets/calendar/7c95a663-5741-46a0-9b29-464a1e1529da.svg'
import asset297 from '../assets/calendar/cc49cdf5-3a9e-4e55-ac3d-91e1f64a54dd.svg'
import asset298 from '../assets/calendar/65d23b0b-ba6f-40ee-8f98-b7f341f343ff.svg'
import asset299 from '../assets/calendar/92121e29-7666-4587-9ff6-653a34eb0584.svg'
import asset300 from '../assets/calendar/a0131ecd-f2ef-43b2-81cf-112abe6e21ec.svg'
import asset301 from '../assets/calendar/7eeebdf8-67ec-4989-b453-73c4ee506ea5.svg'
import asset302 from '../assets/calendar/11627478-6f8e-4e2b-8760-4bc3f5c88aba.svg'
import asset303 from '../assets/calendar/bb192b82-d9a0-4b84-ab5b-e709b1815ec1.svg'
import asset304 from '../assets/calendar/b88f7c85-fd59-4f7b-b137-e151a72d1055.svg'
import asset305 from '../assets/calendar/4fc910ae-075a-40c5-8d71-5d417bfbebdd.svg'
import asset306 from '../assets/calendar/38211e34-0ebb-453f-9f43-77674e7589c7.svg'
import asset307 from '../assets/calendar/8cbbfc67-ade9-414c-b295-86af0a921fdf.svg'
import asset308 from '../assets/calendar/c28d4bc7-b040-418d-bbb8-685095d4d4d9.svg'
import asset309 from '../assets/calendar/50f84edd-757e-4e6e-87be-501d77189e72.svg'
import asset310 from '../assets/calendar/fac0e57b-d139-40e2-b453-758ef156e29a.svg'
import asset311 from '../assets/calendar/87e9184f-b2a8-437e-8049-87ac1a48d480.svg'
import asset312 from '../assets/calendar/b3e3764a-a2fb-4204-ab56-49d787d75289.svg'
import asset313 from '../assets/calendar/ab914f01-a7a4-48d8-91de-0a7d947adb13.svg'
import asset314 from '../assets/calendar/4f51832a-3fba-4b31-ae57-4a3fa29aafc1.svg'
import asset315 from '../assets/calendar/d84af81a-6481-4943-9371-169b872aaffc.svg'
import asset316 from '../assets/calendar/76163013-d6aa-41f0-a0a3-7488c6941bff.svg'
import asset317 from '../assets/calendar/8e64dbe9-3db5-470d-ad5c-d2769d4b49b5.svg'
import asset318 from '../assets/calendar/ae50944f-2b7f-401e-90ea-77711bd7d5dc.svg'
</script>
<template>
<div class="calendar-illustration" aria-hidden="true">
<img :src="accentSpark" alt="" width="1.076" height="1.076" style="position:absolute;left:383.0758px;top:52px" data-figma-node="10:656" />
<div data-figma-node="10:6" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:10" style="position:absolute;inset:0 -0.25% 14.73% 0.25%"><img alt="" :src="asset0" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:11" style="position:absolute;display:flex;inset:16.6% 54.96% 63.46% -7.63%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqw;width:100cqh;transform:rotate(-90deg)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset1" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:86" style="position:absolute;display:flex;inset:45.58% 59.85% 33.14% -13.99%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:hypot(-4.71585cqw,95.4564cqh);width:hypot(95.2841cqw,4.54356cqh);transform:rotate(2.78deg)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset2" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:161" style="position:absolute;display:flex;inset:36.44% 62.34% 43.61% -15.01%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqw;width:100cqh;transform:rotate(90deg)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset3" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:236" style="position:absolute;inset:0.39% 51.15% 79.27% -2.8%"><img alt="" :src="asset4" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:311" style="position:absolute;display:flex;inset:1.08% 2.8% 78.98% 44.53%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqw;width:100cqh;transform:rotate(90deg)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset5" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:386" style="position:absolute;inset:17.29% 41.98% 62.38% 6.36%"><img alt="" :src="asset6" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:461" style="position:absolute;display:flex;inset:18.17% -6.61% 61.89% 53.94%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqw;width:100cqh;transform:rotate(90deg)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset7" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:537" style="position:absolute;display:flex;inset:59.23% 49.06% 14.23% -18.32%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:hypot(69.3164cqw,31.5198cqh);width:hypot(30.6836cqw,-68.4802cqh);transform:rotate(-65.71deg)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset8" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div></div><div data-figma-node="10:612" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:613" style="position:absolute;inset:2.36% 65.9% 96.17% 5.6%"><img alt="" :src="asset9" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:620" style="position:absolute;inset:1.57% 6.36% 95.38% 85.75%"><div style="position:absolute;inset:-1.61%"><img alt="" :src="asset10" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:621" style="position:absolute;inset:2.75% 8.4% 97.25% 88.04%"><div style="position:absolute;inset:-0.75px -5.36%"><img alt="" :src="asset11" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:622" style="position:absolute;inset:3.14% 8.4% 96.86% 88.04%"><div style="position:absolute;inset:-0.75px -5.36%"><img alt="" :src="asset11" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:623" style="position:absolute;inset:3.54% 8.4% 96.46% 88.04%"><div style="position:absolute;inset:-0.75px -5.36%"><img alt="" :src="asset11" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div><div data-figma-node="10:624" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:625" style="position:absolute;display:contents;inset:5.81% 24.94% 86.91% 25.7%"><div data-figma-node="10:626" style="position:absolute;inset:5.81% 24.94% 89.79% 25.7%"><img alt="" :src="asset12" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:627" style="position:absolute;inset:9.32% 35.18% 86.91% 36.64%"><img alt="" :src="asset13" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:628" style="position:absolute;inset:6.44% 25.87% 92.75% 71.34%"><img alt="" :src="asset14" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:629" style="position:absolute;inset:-0.59% 81.17% 81.63% 5.6%"><img alt="" :src="asset15" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:639" style="position:absolute;display:flex;inset:-0.59% 5.6% 81.63% 81.17%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset16" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div></div><div style="position:absolute;left:9px;top:208px;width:375px;height:636px"><div style="position:absolute;left:15.2027px;top:81.2991px;width:343.4252px;height:518.1359px"><div data-figma-node="10:658" style="position:relative;width:100%;height:100%"><img alt="" :src="asset17" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div><div data-figma-node="10:774" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:784" style="position:absolute;inset:4.81% 10.94% 87.8% 81.42%"><div style="position:absolute;inset:0 -1.75% -2.13% -1.75%"><img alt="" :src="asset18" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:789" style="position:absolute;display:flex;inset:4.51% 81.17% 88.1% 11.2%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><div style="position:absolute;inset:0 -1.75% -2.13% -1.75%"><img alt="" :src="asset19" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div></div>
<div data-figma-node="10:794" style="position:absolute;inset:0.8% 4.57% 88.07% 4.05%"><div style="position:absolute;inset:-0.61% -0.12% -0.57% -0.12%"><img alt="" :src="asset20" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:795" style="position:absolute;height:73px;left:8px;top:0;width:364px"><img alt="" :src="asset21" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:799" style="position:absolute;inset:2.14% 8.63% 88.62% 8.42%"><div style="position:absolute;inset:-0.81% 0 -0.76% 0"><img alt="" :src="asset22" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:800" style="position:absolute;inset:3.18% 12.68% 88.69% 12.68%"><div style="position:absolute;inset:-0.71% 0 -0.67% 0"><img alt="" :src="asset23" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:801" style="position:absolute;inset:11.74% 3.33% 87.58% 3.22%"><div style="position:absolute;inset:-7.58% 0"><img alt="" :src="asset24" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:802" style="position:absolute;inset:12.48% 3.43% 86.67% 3.22%"><img alt="" :src="asset25" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:803" style="position:absolute;inset:12.42% 3.33% 87.58% 3.22%"><div style="position:absolute;inset:-0.28px 0"><img alt="" :src="asset26" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:804" style="position:absolute;inset:5.01% 44.6% 88.49% 44.35%"><div style="position:absolute;inset:-1.21%"><img alt="" :src="asset27" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div><div data-figma-node="10:820" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:821" style="position:absolute;inset:15.54% 71.8% 74.62% 9.49%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset28" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:822" style="position:absolute;inset:15.54% 71.8% 74.62% 9.49%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset29" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:823" style="position:absolute;inset:15.84% 72.32% 74.86% 10.01%"><img alt="" :src="asset30" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:824" style="position:absolute;inset:16.15% 72.84% 75.29% 10.53%"><img alt="" :src="asset31" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:825" style="position:absolute;inset:16.15% 72.84% 75.29% 10.53%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset32" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:826" style="position:absolute;inset:24.71% 71.8% 74.62% 9.49%"><img alt="" :src="asset33" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:827" style="position:absolute;inset:25.32% 71.9% 74.68% 9.59%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset34" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:828" style="position:absolute;height:55px;left:39px;overflow:clip;top:102px;width:63px"><img alt="" :src="asset35" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:882" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset36" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:901" style="overflow-wrap:break-word;position:absolute;font-family:'Kalnia';font-weight:600;height:42px;line-height:normal;left:70.5px;color:#a7280b;font-size:32px;text-align:center;top:111px;width:45px;transform:translateX(-50%);font-variation-settings:&quot;wdth&quot; 100">1</p></div><div data-figma-node="10:902" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:903" style="position:absolute;inset:15.54% 51% 74.62% 30.29%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset37" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:904" style="position:absolute;inset:15.54% 51% 74.62% 30.29%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset38" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:905" style="position:absolute;inset:15.84% 51.52% 74.86% 30.81%"><img alt="" :src="asset39" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:906" style="position:absolute;inset:16.15% 52.04% 75.29% 31.33%"><img alt="" :src="asset40" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:907" style="position:absolute;inset:16.15% 52.04% 75.29% 31.33%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset41" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:908" style="position:absolute;inset:24.71% 51% 74.62% 30.29%"><img alt="" :src="asset42" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:909" style="position:absolute;inset:25.32% 51.1% 74.68% 30.39%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset43" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:910" style="position:absolute;height:55px;left:117px;overflow:clip;top:102px;width:63px"><img alt="" :src="asset44" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:964" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset45" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:983" style="overflow-wrap:break-word;position:absolute;font-family:'Montagu Slab';font-weight:600;height:42px;line-height:normal;left:148.5px;color:#a7280b;font-size:32px;text-align:center;top:111px;width:45px;transform:translateX(-50%)">2</p></div><div data-figma-node="10:984" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:985" style="position:absolute;inset:15.54% 30.47% 74.62% 50.82%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset46" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:986" style="position:absolute;inset:15.54% 30.47% 74.62% 50.82%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset47" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:987" style="position:absolute;inset:15.84% 30.99% 74.86% 51.34%"><img alt="" :src="asset48" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:988" style="position:absolute;inset:16.15% 31.51% 75.29% 51.86%"><img alt="" :src="asset49" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:989" style="position:absolute;inset:16.15% 31.51% 75.29% 51.86%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset50" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:990" style="position:absolute;inset:24.71% 30.47% 74.62% 50.82%"><img alt="" :src="asset51" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:991" style="position:absolute;inset:25.32% 30.57% 74.68% 50.93%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset52" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:992" style="position:absolute;height:55px;left:194px;overflow:clip;top:102px;width:63px"><img alt="" :src="asset53" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:1046" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset54" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:1065" style="overflow-wrap:break-word;position:absolute;font-family:'Rozha One';height:42px;line-height:normal;left:225.5px;font-style:normal;color:#a7280b;font-size:34px;text-align:center;top:107px;width:45px;transform:translateX(-50%)">3</p></div><div data-figma-node="10:1066" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:1067" style="position:absolute;inset:15.54% 9.67% 74.62% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset55" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1068" style="position:absolute;inset:15.84% 10.19% 74.86% 72.14%"><img alt="" :src="asset56" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1069" style="position:absolute;inset:16.15% 10.71% 75.29% 72.66%"><img alt="" :src="asset57" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1070" style="position:absolute;inset:16.15% 10.71% 75.29% 72.66%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset58" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1071" style="position:absolute;inset:24.71% 9.67% 74.62% 71.62%"><img alt="" :src="asset59" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1072" style="position:absolute;inset:25.32% 9.77% 74.68% 71.73%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset60" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1073" style="position:absolute;display:contents;inset:16.19% 10.98% 75.4% 72.8%"><div data-figma-node="10:1074" style="position:absolute;inset:16.19% 10.98% 75.42% 72.8%"><img alt="" :src="asset61" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1136" style="position:absolute;inset:16.62% 11.66% 75.98% 73.47%"><img alt="" :src="asset62" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1162" style="position:absolute;inset:24.45% 11.94% 75.4% 73.46%"><img alt="" :src="asset63" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:1183" style="overflow-wrap:break-word;position:absolute;background-clip:text;font-family:'Workbench';height:42px;line-height:normal;left:304px;font-size:32px;color:transparent;text-align:center;top:118px;width:20px;transform:translateX(-50%);font-variation-settings:&quot;BLED&quot; 0, &quot;SCAN&quot; 37;background-image:linear-gradient(90deg, rgb(232, 183, 126) 0.41806%, rgb(255, 230, 188) 17.582%, rgb(255, 240, 210) 57.582%, rgb(239, 192, 135) 89.582%, rgb(202, 144, 84) 99.582%)">4</p></div><div data-figma-node="10:1184" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:1185" style="position:absolute;inset:26.54% 71.8% 63.61% 9.49%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset64" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1186" style="position:absolute;inset:26.54% 71.8% 63.61% 9.49%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset65" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1187" style="position:absolute;inset:26.85% 72.32% 63.86% 10.01%"><img alt="" :src="asset66" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1188" style="position:absolute;inset:27.15% 72.84% 64.28% 10.53%"><img alt="" :src="asset67" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1189" style="position:absolute;inset:27.15% 72.84% 64.28% 10.53%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset68" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1190" style="position:absolute;inset:35.72% 71.8% 63.61% 9.49%"><img alt="" :src="asset69" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1191" style="position:absolute;inset:36.33% 71.9% 63.67% 9.59%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset70" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1192" style="position:absolute;height:55px;left:39px;overflow:clip;top:172px;width:63px"><img alt="" :src="asset71" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:1246" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset72" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:1265" style="overflow-wrap:break-word;position:absolute;font-family:'Fontdiner Swanky';height:42px;line-height:normal;left:70.5px;font-style:normal;color:#a7280b;font-size:32px;text-align:center;top:181px;width:45px;transform:translateX(-50%)">5</p></div><div data-figma-node="10:1266" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:1267" style="position:absolute;inset:26.54% 51% 63.61% 30.29%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset73" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1268" style="position:absolute;inset:26.54% 51% 63.61% 30.29%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset74" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1269" style="position:absolute;inset:26.85% 51.52% 63.86% 30.81%"><img alt="" :src="asset75" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1270" style="position:absolute;inset:27.15% 52.04% 64.28% 31.33%"><img alt="" :src="asset76" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1271" style="position:absolute;inset:27.15% 52.04% 64.28% 31.33%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset77" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1272" style="position:absolute;inset:35.72% 51% 63.61% 30.29%"><img alt="" :src="asset78" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1273" style="position:absolute;inset:36.33% 51.1% 63.67% 30.39%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset79" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1274" style="position:absolute;height:55px;left:117px;overflow:clip;top:172px;width:63px"><img alt="" :src="asset80" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:1328" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset81" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:1347" style="overflow-wrap:break-word;position:absolute;font-family:'Montagu Slab';font-weight:600;height:42px;line-height:normal;left:148.5px;color:#a7280b;font-size:32px;text-align:center;top:181px;width:45px;transform:translateX(-50%)">6</p></div><div data-figma-node="10:1348" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:1349" style="position:absolute;inset:26.54% 30.47% 63.61% 50.82%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset82" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1350" style="position:absolute;inset:26.85% 30.99% 63.86% 51.34%"><img alt="" :src="asset83" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1351" style="position:absolute;inset:27.15% 31.51% 64.28% 51.86%"><img alt="" :src="asset84" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1352" style="position:absolute;inset:27.15% 31.51% 64.28% 51.86%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset85" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1353" style="position:absolute;inset:35.72% 30.47% 63.61% 50.82%"><img alt="" :src="asset86" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1354" style="position:absolute;inset:36.33% 30.57% 63.67% 50.93%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset87" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1355" style="position:absolute;display:contents;inset:27.2% 31.78% 64.39% 52%"><div data-figma-node="10:1356" style="position:absolute;inset:27.2% 31.78% 64.41% 52%"><img alt="" :src="asset88" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1418" style="position:absolute;inset:27.63% 32.46% 64.98% 52.67%"><img alt="" :src="asset89" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1444" style="position:absolute;inset:35.46% 32.74% 64.39% 52.66%"><img alt="" :src="asset90" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:1465" style="overflow-wrap:break-word;position:absolute;background-clip:text;font-family:'Rozha One';height:42px;line-height:normal;left:226px;font-style:normal;font-size:32px;color:transparent;text-align:center;top:179px;width:20px;transform:translateX(-50%);background-image:linear-gradient(175.15599999006002deg, rgb(255, 233, 199) 22.537%, rgb(255, 221, 173) 53.136%, rgb(238, 183, 121) 90.535%)">7</p></div><div data-figma-node="10:1466" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:1467" style="position:absolute;inset:26.54% 9.67% 63.61% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset91" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1468" style="position:absolute;inset:26.54% 9.67% 63.61% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset92" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1469" style="position:absolute;inset:26.85% 10.19% 63.86% 72.14%"><img alt="" :src="asset93" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1470" style="position:absolute;inset:27.15% 10.71% 64.28% 72.66%"><img alt="" :src="asset94" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1471" style="position:absolute;inset:27.15% 10.71% 64.28% 72.66%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset95" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1472" style="position:absolute;inset:35.72% 9.67% 63.61% 71.62%"><img alt="" :src="asset96" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1473" style="position:absolute;inset:36.33% 9.77% 63.67% 71.73%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset97" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1474" style="position:absolute;height:55px;left:272px;overflow:clip;top:172px;width:63px"><img alt="" :src="asset98" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:1528" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset99" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:1547" style="overflow-wrap:break-word;position:absolute;font-family:'Workbench';height:42px;line-height:normal;left:303.5px;color:#a7280b;font-size:32px;text-align:center;top:189px;width:45px;transform:translateX(-50%);font-variation-settings:&quot;BLED&quot; 0, &quot;SCAN&quot; 37">8</p></div><div data-figma-node="10:1548" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:1549" style="position:absolute;inset:37.86% 71.8% 52.29% 9.49%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset100" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1550" style="position:absolute;inset:38.17% 72.32% 52.54% 10.01%"><img alt="" :src="asset101" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1551" style="position:absolute;inset:38.47% 72.84% 52.96% 10.53%"><img alt="" :src="asset102" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1552" style="position:absolute;inset:38.47% 72.84% 52.96% 10.53%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset103" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1553" style="position:absolute;inset:47.04% 71.8% 52.29% 9.49%"><img alt="" :src="asset104" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1554" style="position:absolute;inset:47.65% 71.9% 52.35% 9.59%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset105" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1555" style="position:absolute;display:contents;inset:38.68% 73.12% 52.91% 10.67%"><div data-figma-node="10:1556" style="position:absolute;inset:38.68% 73.12% 52.94% 10.67%"><img alt="" :src="asset106" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1618" style="position:absolute;inset:39.1% 73.79% 53.5% 11.34%"><img alt="" :src="asset107" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1644" style="position:absolute;inset:46.94% 74.07% 52.91% 11.33%"><img alt="" :src="asset108" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:1665" style="overflow-wrap:break-word;position:absolute;background-clip:text;font-family:'Kalnia';font-weight:600;height:42px;line-height:normal;left:70.5px;font-size:32px;color:transparent;text-align:center;top:252px;width:43px;transform:translateX(-50%);font-variation-settings:&quot;wdth&quot; 100;background-image:linear-gradient(167.84796087775638deg, rgb(255, 233, 199) 22.435%, rgb(255, 221, 173) 51.218%, rgb(238, 183, 121) 86.398%)">9</p></div><div data-figma-node="10:1666" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:1667" style="position:absolute;inset:37.86% 51% 52.29% 30.29%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset109" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1668" style="position:absolute;inset:37.86% 51% 52.29% 30.29%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset110" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1669" style="position:absolute;inset:38.17% 51.52% 52.54% 30.81%"><img alt="" :src="asset111" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1670" style="position:absolute;inset:38.47% 52.04% 52.96% 31.33%"><img alt="" :src="asset112" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1671" style="position:absolute;inset:38.47% 52.04% 52.96% 31.33%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset113" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1672" style="position:absolute;inset:47.04% 51% 52.29% 30.29%"><img alt="" :src="asset114" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1673" style="position:absolute;inset:47.65% 51.1% 52.35% 30.39%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset115" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1674" style="position:absolute;height:55px;left:117px;overflow:clip;top:244px;width:63px"><img alt="" :src="asset116" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:1728" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset117" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:1747" style="overflow-wrap:break-word;position:absolute;font-family:'Montagu Slab';font-weight:600;height:42px;line-height:normal;left:148.5px;color:#a7280b;font-size:32px;text-align:center;top:253px;width:45px;transform:translateX(-50%)">10</p></div><div data-figma-node="10:1748" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:1749" style="position:absolute;inset:37.86% 30.47% 52.29% 50.82%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset118" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1750" style="position:absolute;inset:38.17% 30.99% 52.54% 51.34%"><img alt="" :src="asset119" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1751" style="position:absolute;inset:38.47% 31.51% 52.96% 51.86%"><img alt="" :src="asset120" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1752" style="position:absolute;inset:38.47% 31.51% 52.96% 51.86%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset121" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1753" style="position:absolute;inset:47.04% 30.47% 52.29% 50.82%"><img alt="" :src="asset122" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1754" style="position:absolute;inset:47.65% 30.57% 52.35% 50.93%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset123" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1755" style="position:absolute;display:contents;inset:38.68% 31.78% 52.91% 52%"><div data-figma-node="10:1756" style="position:absolute;inset:38.68% 31.78% 52.94% 52%"><img alt="" :src="asset124" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1818" style="position:absolute;inset:39.1% 32.46% 53.5% 52.67%"><img alt="" :src="asset125" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1844" style="position:absolute;inset:46.94% 32.74% 52.91% 52.66%"><img alt="" :src="asset126" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:1865" style="overflow-wrap:break-word;position:absolute;background-clip:text;font-family:'Rozha One';height:42px;line-height:normal;left:225.5px;font-style:normal;font-size:32px;color:transparent;text-align:center;top:253px;width:41px;transform:translateX(-50%);background-image:linear-gradient(167.27405596916827deg, rgb(255, 233, 199) 22.435%, rgb(255, 221, 173) 51.218%, rgb(238, 183, 121) 86.398%)">11</p></div><div data-figma-node="10:1866" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:1867" style="position:absolute;inset:37.86% 9.67% 52.29% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset127" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1868" style="position:absolute;inset:37.86% 9.67% 52.29% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset128" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1869" style="position:absolute;inset:38.17% 10.19% 52.54% 72.14%"><img alt="" :src="asset129" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1870" style="position:absolute;inset:38.47% 10.71% 52.96% 72.66%"><img alt="" :src="asset130" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1871" style="position:absolute;inset:38.47% 10.71% 52.96% 72.66%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset131" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1872" style="position:absolute;inset:47.04% 9.67% 52.29% 71.62%"><img alt="" :src="asset132" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1873" style="position:absolute;inset:47.65% 9.77% 52.35% 71.73%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset133" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1874" style="position:absolute;height:55px;left:272px;overflow:clip;top:245px;width:63px"><img alt="" :src="asset134" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:1928" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset135" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:1947" style="overflow-wrap:break-word;position:absolute;font-family:'Workbench';height:42px;line-height:normal;left:304px;color:#a7280b;font-size:32px;text-align:center;top:261px;width:40px;transform:translateX(-50%);font-variation-settings:&quot;BLED&quot; 0, &quot;SCAN&quot; 37">12</p></div><div data-figma-node="10:1948" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:1949" style="position:absolute;inset:48.87% 71.8% 41.28% 9.49%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset136" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1950" style="position:absolute;inset:48.87% 71.8% 41.28% 9.49%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset137" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1951" style="position:absolute;inset:49.17% 72.32% 41.53% 10.01%"><img alt="" :src="asset138" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1952" style="position:absolute;inset:49.48% 72.84% 41.96% 10.53%"><img alt="" :src="asset139" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1953" style="position:absolute;inset:49.48% 72.84% 41.96% 10.53%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset140" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1954" style="position:absolute;inset:58.04% 71.8% 41.28% 9.49%"><img alt="" :src="asset141" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:1955" style="position:absolute;inset:58.65% 71.9% 41.35% 9.59%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset142" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:1956" style="position:absolute;height:55px;left:39px;overflow:clip;top:315px;width:63px"><img alt="" :src="asset143" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:2010" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset144" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:2029" style="overflow-wrap:break-word;position:absolute;font-family:'Kalnia';font-weight:600;height:42px;line-height:normal;left:71px;color:#a7280b;font-size:32px;text-align:center;top:323px;width:40px;transform:translateX(-50%);font-variation-settings:&quot;wdth&quot; 100">13</p></div><div data-figma-node="10:2030" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:2031" style="position:absolute;inset:48.87% 51% 41.28% 30.29%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset145" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2032" style="position:absolute;inset:49.17% 51.52% 41.53% 30.81%"><img alt="" :src="asset146" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2033" style="position:absolute;inset:49.48% 52.04% 41.96% 31.33%"><img alt="" :src="asset147" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2034" style="position:absolute;inset:49.48% 52.04% 41.96% 31.33%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset148" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2035" style="position:absolute;inset:58.04% 51% 41.28% 30.29%"><img alt="" :src="asset149" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2036" style="position:absolute;inset:58.65% 51.1% 41.35% 30.39%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset150" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:2037" style="overflow-wrap:break-word;position:absolute;background-clip:text;font-family:'Rozha One';height:42px;line-height:normal;left:148.5px;font-style:normal;font-size:38px;color:transparent;text-align:center;top:318px;width:43px;transform:translateX(-50%);background-image:linear-gradient(167.84796087775638deg, rgb(255, 233, 199) 22.435%, rgb(255, 221, 173) 51.218%, rgb(238, 183, 121) 86.398%)">14</p>
<div data-figma-node="10:2038" style="position:absolute;display:contents;inset:49.69% 52.32% 41.9% 31.47%"><div data-figma-node="10:2039" style="position:absolute;inset:49.69% 52.32% 41.93% 31.47%"><img alt="" :src="asset151" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2101" style="position:absolute;inset:50.11% 52.99% 42.49% 32.14%"><img alt="" :src="asset152" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2127" style="position:absolute;inset:57.94% 53.27% 41.9% 32.13%"><img alt="" :src="asset153" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div><div data-figma-node="10:2148" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:2149" style="position:absolute;inset:48.87% 30.47% 41.28% 50.82%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset154" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2150" style="position:absolute;inset:48.87% 30.47% 41.28% 50.82%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset155" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2151" style="position:absolute;inset:49.17% 30.99% 41.53% 51.34%"><img alt="" :src="asset156" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2152" style="position:absolute;inset:49.48% 31.51% 41.96% 51.86%"><img alt="" :src="asset157" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2153" style="position:absolute;inset:49.48% 31.51% 41.96% 51.86%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset158" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2154" style="position:absolute;inset:58.04% 30.47% 41.28% 50.82%"><img alt="" :src="asset159" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2155" style="position:absolute;inset:58.65% 30.57% 41.35% 50.93%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset160" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2156" style="position:absolute;height:55px;left:194px;overflow:clip;top:315px;width:63px"><img alt="" :src="asset161" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:2210" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset162" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:2229" style="overflow-wrap:break-word;position:absolute;font-family:'Rozha One';height:42px;line-height:normal;left:226px;font-style:normal;color:#a7280b;font-size:32px;text-align:center;top:323px;width:40px;transform:translateX(-50%)">15</p></div><div data-figma-node="10:2230" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:2231" style="position:absolute;inset:48.87% 9.67% 41.28% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset163" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2232" style="position:absolute;inset:48.87% 9.67% 41.28% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset164" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2233" style="position:absolute;inset:49.17% 10.19% 41.53% 72.14%"><img alt="" :src="asset165" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2234" style="position:absolute;inset:49.48% 10.71% 41.96% 72.66%"><img alt="" :src="asset166" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2235" style="position:absolute;inset:49.48% 10.71% 41.96% 72.66%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset167" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2236" style="position:absolute;inset:58.04% 9.67% 41.28% 71.62%"><img alt="" :src="asset168" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2237" style="position:absolute;inset:58.65% 9.77% 41.35% 71.73%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset169" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2238" style="position:absolute;height:55px;left:272px;overflow:clip;top:315px;width:63px"><img alt="" :src="asset170" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:2292" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset171" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:2311" style="overflow-wrap:break-word;position:absolute;font-family:'Libre Bodoni';font-weight:400;height:42px;line-height:normal;left:304px;color:#a7280b;font-size:32px;text-align:center;top:326px;width:38px;transform:translateX(-50%)">16</p></div><div data-figma-node="10:2312" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:2313" style="position:absolute;inset:60.19% 71.8% 29.96% 9.49%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset172" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2314" style="position:absolute;inset:60.5% 72.32% 30.21% 10.01%"><img alt="" :src="asset173" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2315" style="position:absolute;inset:60.8% 72.84% 30.64% 10.53%"><img alt="" :src="asset174" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2316" style="position:absolute;inset:60.8% 72.84% 30.64% 10.53%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset175" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2317" style="position:absolute;inset:69.36% 71.8% 29.96% 9.49%"><img alt="" :src="asset176" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2318" style="position:absolute;inset:69.98% 71.9% 30.02% 9.59%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset177" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2319" style="position:absolute;display:contents;inset:61.01% 73.12% 30.58% 10.67%"><div data-figma-node="10:2320" style="position:absolute;inset:61.01% 73.12% 30.61% 10.67%"><img alt="" :src="asset178" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2382" style="position:absolute;inset:61.43% 73.79% 31.17% 11.34%"><img alt="" :src="asset179" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2408" style="position:absolute;inset:69.26% 74.07% 30.58% 11.33%"><img alt="" :src="asset180" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:2429" style="overflow-wrap:break-word;position:absolute;background-clip:text;font-family:'Kalnia';font-weight:600;height:42px;line-height:normal;left:70.5px;font-size:32px;color:transparent;text-align:center;top:395px;width:43px;transform:translateX(-50%);font-variation-settings:&quot;wdth&quot; 100;background-image:linear-gradient(167.84796087775638deg, rgb(255, 233, 199) 22.435%, rgb(255, 221, 173) 51.218%, rgb(238, 183, 121) 86.398%)">17</p></div><div data-figma-node="10:2430" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:2431" style="position:absolute;inset:60.19% 51% 29.96% 30.29%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset181" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2432" style="position:absolute;inset:60.19% 51% 29.96% 30.29%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset182" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2433" style="position:absolute;inset:60.5% 51.52% 30.21% 30.81%"><img alt="" :src="asset183" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2434" style="position:absolute;inset:60.8% 52.04% 30.64% 31.33%"><img alt="" :src="asset184" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2435" style="position:absolute;inset:60.8% 52.04% 30.64% 31.33%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset185" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2436" style="position:absolute;inset:69.36% 51% 29.96% 30.29%"><img alt="" :src="asset186" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2437" style="position:absolute;inset:69.98% 51.1% 30.02% 30.39%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset187" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2438" style="position:absolute;height:55px;left:117px;overflow:clip;top:387px;width:63px"><img alt="" :src="asset188" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:2492" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset189" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:2511" style="overflow-wrap:break-word;position:absolute;font-family:'Rozha One';height:42px;line-height:normal;left:149px;font-style:normal;color:#a7280b;font-size:38px;text-align:center;top:390px;width:36px;transform:translateX(-50%)">18</p></div><div data-figma-node="10:2512" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:2513" style="position:absolute;inset:60.19% 30.47% 29.96% 50.82%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset190" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2514" style="position:absolute;inset:60.5% 30.99% 30.21% 51.34%"><img alt="" :src="asset191" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2515" style="position:absolute;inset:60.8% 31.51% 30.64% 51.86%"><img alt="" :src="asset192" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2516" style="position:absolute;inset:60.8% 31.51% 30.64% 51.86%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset193" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2517" style="position:absolute;inset:69.36% 30.47% 29.96% 50.82%"><img alt="" :src="asset194" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2518" style="position:absolute;inset:69.98% 30.57% 30.02% 50.93%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset195" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2519" style="position:absolute;display:contents;inset:61.01% 31.78% 30.58% 52%"><div data-figma-node="10:2520" style="position:absolute;inset:61.01% 31.78% 30.61% 52%"><img alt="" :src="asset196" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2582" style="position:absolute;inset:61.43% 32.46% 31.17% 52.67%"><img alt="" :src="asset197" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2608" style="position:absolute;inset:69.26% 32.74% 30.58% 52.66%"><img alt="" :src="asset198" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:2629" style="overflow-wrap:break-word;position:absolute;background-clip:text;font-family:'Rozha One';height:42px;line-height:normal;left:225.5px;font-style:normal;font-size:32px;color:transparent;text-align:center;top:395px;width:43px;transform:translateX(-50%);background-image:linear-gradient(167.84796087775638deg, rgb(255, 233, 199) 22.435%, rgb(255, 221, 173) 51.218%, rgb(238, 183, 121) 86.398%)">19</p></div><div data-figma-node="10:2630" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:2631" style="position:absolute;inset:60.19% 9.67% 29.96% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset199" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2632" style="position:absolute;inset:60.19% 9.67% 29.96% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset200" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2633" style="position:absolute;inset:60.5% 10.19% 30.21% 72.14%"><img alt="" :src="asset201" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2634" style="position:absolute;inset:60.8% 10.71% 30.64% 72.66%"><img alt="" :src="asset202" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2635" style="position:absolute;inset:60.8% 10.71% 30.64% 72.66%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset203" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2636" style="position:absolute;inset:69.36% 9.67% 29.96% 71.62%"><img alt="" :src="asset204" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2637" style="position:absolute;inset:69.98% 9.77% 30.02% 71.73%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset205" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2638" style="position:absolute;height:55px;left:272px;overflow:clip;top:387px;width:63px"><img alt="" :src="asset206" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:2692" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset207" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:2711" style="overflow-wrap:break-word;position:absolute;font-family:'Fraunces';font-weight:400;height:44px;line-height:normal;left:303.5px;color:#a7280b;font-size:30px;text-align:center;top:398px;width:51px;transform:translateX(-50%);font-variation-settings:&quot;SOFT&quot; 0, &quot;WONK&quot; 1">20</p></div><div data-figma-node="10:2712" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:2713" style="position:absolute;inset:71.2% 71.8% 18.96% 9.49%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset208" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2714" style="position:absolute;inset:71.5% 72.32% 19.2% 10.01%"><img alt="" :src="asset209" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2715" style="position:absolute;inset:71.81% 72.84% 19.63% 10.53%"><img alt="" :src="asset210" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2716" style="position:absolute;inset:71.81% 72.84% 19.63% 10.53%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset211" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2717" style="position:absolute;inset:80.37% 71.8% 18.96% 9.49%"><img alt="" :src="asset212" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2718" style="position:absolute;inset:80.98% 71.9% 19.02% 9.59%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset213" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2719" style="position:absolute;display:contents;inset:72.01% 73.12% 19.58% 10.67%"><div data-figma-node="10:2720" style="position:absolute;inset:72.01% 73.12% 19.6% 10.67%"><img alt="" :src="asset214" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2782" style="position:absolute;inset:72.44% 73.79% 20.17% 11.34%"><img alt="" :src="asset215" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2808" style="position:absolute;inset:80.27% 74.07% 19.58% 11.33%"><img alt="" :src="asset216" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:2829" style="overflow-wrap:break-word;position:absolute;background-clip:text;font-family:'Kalnia';font-weight:600;height:42px;line-height:normal;left:70.5px;font-size:32px;color:transparent;text-align:center;top:465px;width:47px;transform:translateX(-50%);font-variation-settings:&quot;wdth&quot; 100;background-image:linear-gradient(168.85513473437425deg, rgb(255, 233, 199) 22.435%, rgb(255, 221, 173) 51.218%, rgb(238, 183, 121) 86.398%)">21</p></div><div data-figma-node="10:2830" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:2831" style="position:absolute;inset:71.2% 9.67% 18.96% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset217" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2832" style="position:absolute;inset:71.2% 9.67% 18.96% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset218" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2833" style="position:absolute;inset:71.5% 10.19% 19.2% 72.14%"><img alt="" :src="asset219" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2834" style="position:absolute;inset:71.81% 10.71% 19.63% 72.66%"><img alt="" :src="asset220" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2835" style="position:absolute;inset:71.81% 10.71% 19.63% 72.66%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset221" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2836" style="position:absolute;inset:80.37% 9.67% 18.96% 71.62%"><img alt="" :src="asset222" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2837" style="position:absolute;inset:80.98% 9.77% 19.02% 71.73%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset223" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2838" style="position:absolute;height:55px;left:272px;overflow:clip;top:457px;width:63px"><img alt="" :src="asset224" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:2892" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset225" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:2911" style="overflow-wrap:break-word;position:absolute;font-family:'BioRhyme';font-weight:400;height:42px;line-height:normal;left:303px;color:#a7280b;font-size:32px;text-align:center;top:461px;width:44px;transform:translateX(-50%);font-variation-settings:&quot;wdth&quot; 100">22</p></div><div data-figma-node="10:2912" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:2913" style="position:absolute;inset:82.2% 71.8% 7.95% 9.49%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset226" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2914" style="position:absolute;inset:82.2% 71.8% 7.95% 9.49%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset227" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2915" style="position:absolute;inset:82.51% 72.32% 8.2% 10.01%"><img alt="" :src="asset228" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2916" style="position:absolute;inset:82.81% 72.84% 8.62% 10.53%"><img alt="" :src="asset229" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2917" style="position:absolute;inset:82.81% 72.84% 8.62% 10.53%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset230" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2918" style="position:absolute;inset:91.38% 71.8% 7.95% 9.49%"><img alt="" :src="asset231" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2919" style="position:absolute;inset:91.99% 71.9% 8.01% 9.59%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset232" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2920" style="position:absolute;height:55px;left:39px;overflow:clip;top:527px;width:63px"><img alt="" :src="asset233" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:2974" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset234" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:2993" style="overflow-wrap:break-word;position:absolute;font-family:'Kalnia';font-weight:600;height:42px;line-height:normal;left:70px;color:#a7280b;font-size:32px;text-align:center;top:534px;width:44px;transform:translateX(-50%);font-variation-settings:&quot;wdth&quot; 100">23</p></div><div data-figma-node="10:2994" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:2995" style="position:absolute;inset:82.2% 9.67% 7.95% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset235" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2996" style="position:absolute;inset:82.2% 9.67% 7.95% 71.62%"><div style="position:absolute;inset:-0.71% -0.64%"><img alt="" :src="asset236" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:2997" style="position:absolute;inset:82.51% 10.19% 8.2% 72.14%"><img alt="" :src="asset237" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2998" style="position:absolute;inset:82.81% 10.71% 8.62% 72.66%"><img alt="" :src="asset238" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:2999" style="position:absolute;inset:82.81% 10.71% 8.62% 72.66%"><div style="position:absolute;inset:-0.3% -0.26%"><img alt="" :src="asset239" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3000" style="position:absolute;inset:91.38% 9.67% 7.95% 71.62%"><img alt="" :src="asset240" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3001" style="position:absolute;inset:91.99% 9.77% 8.01% 71.73%"><div style="position:absolute;inset:-0.41px 0"><img alt="" :src="asset241" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3002" style="position:absolute;height:55px;left:272px;overflow:clip;top:527px;width:63px"><img alt="" :src="asset242" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" />
<div data-figma-node="10:3056" style="position:absolute;inset:12.43% 13.24% 10.99% 12.82%"><img alt="" :src="asset243" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:3075" style="overflow-wrap:break-word;position:absolute;font-family:'BioRhyme';font-weight:600;height:42px;line-height:normal;left:303px;color:#a7280b;font-size:32px;text-align:center;top:531px;width:44px;transform:translateX(-50%);font-variation-settings:&quot;wdth&quot; 100">24</p></div><div data-figma-node="10:3094" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:3095" style="position:absolute;inset:71.07% 36.59% 7.77% 36.38%"><div style="position:absolute;inset:-0.23% -0.3%"><img alt="" :src="asset244" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3096" style="position:absolute;inset:72.11% 38.67% 8.62% 38.46%"><div style="position:absolute;inset:-0.22% -0.31%"><img alt="" :src="asset245" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3097" style="position:absolute;inset:72.78% 40.23% 23.73% 40.02%"><div style="position:absolute;inset:-1.1% -0.33%"><img alt="" :src="asset246" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3098" style="position:absolute;inset:72.78% 43.04% 23.67% 42.72%"><div style="position:absolute;inset:0 -1.19% -6.32% -1.18%"><img alt="" :src="asset247" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3099" style="position:absolute;inset:76.64% 61.64% 23.36% 36.38%"><div style="position:absolute;inset:-0.28px 0"><img alt="" :src="asset248" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3100" style="position:absolute;inset:76.64% 36.59% 23.36% 61.43%"><div style="position:absolute;inset:-0.28px 0"><img alt="" :src="asset248" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3101" style="position:absolute;inset:76.81% 40.33% 15.17% 40%"><div style="position:absolute;inset:-0.29% -0.3% -0.44% 0"><img alt="" :src="asset249" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3102" style="position:absolute;inset:86.06% 51.77% 9.66% 41.68%"><div style="position:absolute;inset:-0.82% -0.91%"><img alt="" :src="asset250" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3103" style="position:absolute;inset:86.06% 42% 9.66% 51.56%"><div style="position:absolute;inset:-0.82% -0.92%"><img alt="" :src="asset251" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3104" style="position:absolute;inset:84.89% 50.1% 8.62% 49.9%"><div style="position:absolute;inset:0 -0.32px"><img alt="" :src="asset252" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<p data-figma-node="10:3105" style="overflow-wrap:break-word;position:absolute;background-clip:text;font-family:'Kalnia';font-weight:600;height:42px;line-height:normal;left:187.5px;font-size:32px;color:transparent;text-align:center;top:486px;width:47px;transform:translateX(-50%);font-variation-settings:&quot;wdth&quot; 100;background-image:linear-gradient(168.85513473437425deg, rgb(255, 233, 199) 22.435%, rgb(255, 221, 173) 51.218%, rgb(238, 183, 121) 86.398%)">25</p>
<div data-figma-node="10:3106" style="position:absolute;inset:82.35% 44.8% 11.5% 44.39%"><div style="position:absolute;inset:-0.17% 0 0 0"><img alt="" :src="asset253" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div><div data-figma-node="10:3122" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:3123" style="position:absolute;inset:10.58% 57.61% 83.74% 6.49%"><div style="position:absolute;inset:-0.45% -0.12%"><img alt="" :src="asset254" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3142" style="position:absolute;display:flex;inset:10.58% 6.23% 83.74% 57.87%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><div style="position:absolute;inset:-0.45% -0.12%"><img alt="" :src="asset255" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div></div>
<div data-figma-node="10:3161" style="position:absolute;left:140px;width:94px;height:94px;top:36px"><img alt="" :src="asset256" style="position:absolute;inset:0;max-width:none;object-fit:cover;pointer-events:none;width:100%;height:100%" draggable="false" /></div></div><div style="position:absolute;left:339px;top:265px;width:44px;height:231px"><div data-figma-node="10:3178" style="position:relative;width:100%;height:100%"><img alt="" :src="asset257" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div><div style="position:absolute;left:349px;top:116px;width:31px;height:161px"><div data-figma-node="10:3186" style="position:relative;width:100%;height:100%"><img alt="" :src="asset258" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div><div style="position:absolute;left:346px;top:470px;width:31px;height:161px"><div data-figma-node="10:3194" style="position:relative;width:100%;height:100%"><img alt="" :src="asset259" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div><div data-figma-node="10:3228" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:3229" style="position:absolute;display:contents;inset:66.4% 57.48% 22.13% 25.85%"><div data-figma-node="10:3230" style="position:absolute;inset:67.67% 57.48% 22.13% 25.85%"><div style="position:absolute;inset:-0.14% -0.22%"><img alt="" :src="asset260" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3231" style="position:absolute;inset:66.4% 64.32% 32.21% 31.9%"><img alt="" :src="asset261" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3232" style="position:absolute;inset:69.45% 63.1% 29.37% 32.32%"><div style="position:absolute;inset:-3.1% -1.85% -1.79% -1.35%"><img alt="" :src="asset262" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3233" style="position:absolute;inset:70.92% 63.54% 27.36% 29.52%"><div style="position:absolute;inset:-1.72% -1.02% -1.27% -1.03%"><img alt="" :src="asset263" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3234" style="position:absolute;inset:73.97% 59.54% 24.21% 28.37%"><div style="position:absolute;inset:-1.6% -0.78% -1.1% -0.57%"><img alt="" :src="asset264" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3235" style="position:absolute;inset:71.61% 62.11% 27.59% 35.11%"><div style="position:absolute;inset:-2.6% -2.15% -2.51% -1.74%"><img alt="" :src="asset265" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3236" style="position:absolute;inset:68.56% 65.37% 30.86% 33.14%"><img alt="" :src="asset266" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3237" style="position:absolute;inset:69.37% 63.78% 30.14% 34.93%"><img alt="" :src="asset267" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3238" style="position:absolute;inset:70.61% 66.31% 28.7% 31.9%"><img alt="" :src="asset268" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3239" style="position:absolute;inset:70.95% 62.54% 28.51% 36.07%"><img alt="" :src="asset269" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3240" style="position:absolute;inset:71.77% 68.15% 27.73% 30.57%"><img alt="" :src="asset270" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3241" style="position:absolute;inset:73.4% 66.71% 25.99% 31.71%"><img alt="" :src="asset271" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3242" style="position:absolute;inset:74.35% 61.05% 25.11% 37.56%"><img alt="" :src="asset272" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3243" style="position:absolute;inset:75.27% 68.79% 24.04% 29.42%"><img alt="" :src="asset273" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3244" style="position:absolute;inset:76.23% 60.06% 23.24% 38.55%"><img alt="" :src="asset274" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3245" style="position:absolute;inset:72.59% 64.23% 26.6% 35.77%"><div style="position:absolute;inset:0 -0.26px"><img alt="" :src="asset275" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3246" style="position:absolute;inset:73.36% 63.33% 25.95% 34.88%"><div style="position:absolute;inset:-2.89%"><img alt="" :src="asset276" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3247" style="position:absolute;display:contents;inset:66.4% 25.74% 22.13% 57.59%;container-type:size"><div data-figma-node="10:3248" style="position:absolute;display:flex;inset:67.67% 25.74% 22.13% 57.59%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><div style="position:absolute;inset:-0.14% -0.22%"><img alt="" :src="asset277" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div></div>
<div data-figma-node="10:3249" style="position:absolute;display:flex;inset:66.4% 31.79% 32.21% 64.44%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset261" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3250" style="position:absolute;display:flex;inset:69.55% 32.06% 29.37% 63.36%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><div style="position:absolute;inset:-3.19% -1.92% -1.95% -1.39%"><img alt="" :src="asset278" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div></div>
<div data-figma-node="10:3251" style="position:absolute;display:flex;inset:71.22% 29.01% 27.21% 64.12%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><div style="position:absolute;inset:-1.88% -1.03% -1.43% -1.35%"><img alt="" :src="asset279" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div></div>
<div data-figma-node="10:3252" style="position:absolute;display:flex;inset:73.87% 28.37% 24.12% 59.41%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><div style="position:absolute;inset:-1.48% -0.75% -0.99% -0.55%"><img alt="" :src="asset280" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div></div>
<div data-figma-node="10:3253" style="position:absolute;display:flex;inset:71.81% 34.99% 27.36% 61.7%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><div style="position:absolute;inset:-2.36% -2.04% -2.5% -1.54%"><img alt="" :src="asset281" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div></div>
<div data-figma-node="10:3254" style="position:absolute;display:flex;inset:68.56% 33.03% 30.86% 65.48%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset266" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3255" style="position:absolute;display:flex;inset:69.37% 34.82% 30.14% 63.89%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset282" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3256" style="position:absolute;display:flex;inset:70.61% 31.79% 28.7% 66.42%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset268" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3257" style="position:absolute;display:flex;inset:70.95% 35.96% 28.51% 62.65%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset272" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3258" style="position:absolute;display:flex;inset:71.77% 30.45% 27.73% 68.26%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset282" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3259" style="position:absolute;display:flex;inset:73.4% 31.59% 25.99% 66.82%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset283" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3260" style="position:absolute;display:flex;inset:74.35% 37.45% 25.11% 61.17%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset269" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3261" style="position:absolute;display:flex;inset:75.27% 29.31% 24.04% 68.9%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset273" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3262" style="position:absolute;display:flex;inset:76.23% 38.44% 23.24% 60.17%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><img alt="" :src="asset284" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3263" style="position:absolute;display:flex;inset:72.59% 35.66% 26.6% 64.34%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:0px;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><div style="position:absolute;inset:0 -0.26px"><img alt="" :src="asset275" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div></div>
<div data-figma-node="10:3264" style="position:absolute;display:flex;inset:73.36% 34.77% 25.95% 63.45%;align-items:center;justify-content:center;container-type:size"><div style="flex:none;height:100cqh;width:100cqw;transform:scaleX(-1)"><div style="position:relative;width:100%;height:100%"><div style="position:absolute;inset:-2.89%"><img alt="" :src="asset285" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div></div></div></div><div data-figma-node="10:3265" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:3266" style="position:absolute;inset:78.07% 36.45% 19.83% 36.86%"><img alt="" :src="asset286" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3267" style="position:absolute;inset:78.07% 37.45% 20.25% 37.36%"><img alt="" :src="asset287" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3268" style="position:absolute;inset:78.45% 0 18.8% 0.51%"><img alt="" :src="asset288" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3269" style="position:absolute;inset:79.9% 2.53% 19.41% 3.04%"><div style="position:absolute;inset:-5.77% -0.11%"><img alt="" :src="asset289" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div><div data-figma-node="10:3270" style="display:contents;position:relative;width:100%;height:100%"><div data-figma-node="10:3271" style="position:absolute;display:contents;inset:76.54% 68.1% 20.49% 24.47%"><div data-figma-node="10:3272" style="position:absolute;inset:77.45% 68.19% 20.49% 24.56%"><img alt="" :src="asset290" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3273" style="position:absolute;inset:77.29% 68.1% 22.26% 24.47%"><img alt="" :src="asset291" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3274" style="position:absolute;inset:77.74% 68.19% 22.26% 24.56%"><div style="position:absolute;inset:-0.14px 0"><img alt="" :src="asset292" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3275" style="position:absolute;inset:77.29% 71.37% 20.49% 27.66%"><img alt="" :src="asset293" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3276" style="position:absolute;inset:76.54% 69.63% 22.67% 25.92%"><div style="position:absolute;inset:-13.1% -6.09% -13.46% -6.09%"><img alt="" :src="asset294" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3277" style="position:absolute;display:contents;inset:76.37% 60.85% 20.45% 32.4%"><div data-figma-node="10:3278" style="position:absolute;inset:77.33% 60.95% 20.45% 32.5%"><img alt="" :src="asset295" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3279" style="position:absolute;inset:77.18% 60.85% 22.35% 32.4%"><img alt="" :src="asset296" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3280" style="position:absolute;inset:77.65% 60.95% 22.35% 32.5%"><div style="position:absolute;inset:-0.14px 0"><img alt="" :src="asset297" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3281" style="position:absolute;inset:77.18% 63.82% 20.45% 35.3%"><img alt="" :src="asset298" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3282" style="position:absolute;inset:76.37% 62.25% 22.78% 33.72%"><div style="position:absolute;inset:-11.14% -6.09% -11.41% -6.09%"><img alt="" :src="asset299" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3283" style="position:absolute;display:contents;inset:77.93% 64.62% 20.07% 29.82%"><div data-figma-node="10:3284" style="position:absolute;inset:78.59% 64.72% 20.07% 29.92%"><img alt="" :src="asset300" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3285" style="position:absolute;inset:78.44% 64.62% 21.26% 29.82%"><img alt="" :src="asset301" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3286" style="position:absolute;inset:78.74% 64.72% 21.26% 29.92%"><div style="position:absolute;inset:-0.14px 0"><img alt="" :src="asset302" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3287" style="position:absolute;inset:78.44% 67.07% 20.07% 32.21%"><img alt="" :src="asset303" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3288" style="position:absolute;inset:77.93% 65.77% 21.52% 30.91%"><div style="position:absolute;inset:-14.25% -6.09% -15.22% -6.1%"><img alt="" :src="asset304" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3289" style="position:absolute;display:contents;inset:76.42% 31.79% 20.45% 61.46%"><div data-figma-node="10:3290" style="position:absolute;inset:77.37% 31.89% 20.45% 61.56%"><img alt="" :src="asset305" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3291" style="position:absolute;inset:77.22% 31.79% 22.32% 61.46%"><img alt="" :src="asset306" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3292" style="position:absolute;inset:77.68% 31.89% 22.32% 61.56%"><div style="position:absolute;inset:-0.14px 0"><img alt="" :src="asset307" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3293" style="position:absolute;inset:77.22% 34.76% 20.45% 64.36%"><img alt="" :src="asset308" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3294" style="position:absolute;inset:76.42% 33.19% 22.74% 62.78%"><div style="position:absolute;inset:-11.32% -6.09% -11.61% -6.09%"><img alt="" :src="asset309" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3295" style="position:absolute;display:contents;inset:76.54% 23.96% 20.49% 69.3%"><div data-figma-node="10:3296" style="position:absolute;inset:77.45% 24.06% 20.49% 69.4%"><img alt="" :src="asset310" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3297" style="position:absolute;inset:77.29% 23.96% 22.26% 69.3%"><img alt="" :src="asset311" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3298" style="position:absolute;inset:77.74% 24.06% 22.26% 69.4%"><div style="position:absolute;inset:-0.14px 0"><img alt="" :src="asset307" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3299" style="position:absolute;inset:77.29% 26.92% 20.49% 72.2%"><img alt="" :src="asset312" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3300" style="position:absolute;inset:76.54% 25.35% 22.67% 70.62%"><div style="position:absolute;inset:-11.88% -6.09% -12.23% -6.09%"><img alt="" :src="asset313" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div>
<div data-figma-node="10:3301" style="position:absolute;display:contents;inset:77.89% 28.22% 20.11% 66.03%"><div data-figma-node="10:3302" style="position:absolute;inset:78.56% 28.32% 20.11% 66.12%"><img alt="" :src="asset314" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3303" style="position:absolute;inset:78.4% 28.22% 21.3% 66.03%"><img alt="" :src="asset315" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3304" style="position:absolute;inset:78.7% 28.32% 21.3% 66.12%"><div style="position:absolute;inset:-0.14px 0"><img alt="" :src="asset316" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div>
<div data-figma-node="10:3305" style="position:absolute;inset:78.4% 30.75% 20.11% 68.5%"><img alt="" :src="asset317" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%" draggable="false" /></div>
<div data-figma-node="10:3306" style="position:absolute;inset:77.89% 29.41% 21.56% 67.15%"><div style="position:absolute;inset:-14.76% -6.09% -15.73% -6.1%"><img alt="" :src="asset318" style="display:block;max-width:none;width:100%;height:100%" draggable="false" /></div></div></div></div>
</div>
</template>
<style scoped>
.calendar-illustration { position:absolute; inset:0; pointer-events:none; user-select:none; }
.calendar-illustration :deep(p) { margin:0; letter-spacing:0; }
</style>
