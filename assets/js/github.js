const config={owner:'tsai97216',repository:'merch',branch:'main',dataPath:'data/merch.json',imagePath:'images/'};
export const github={getConfig:()=>({...config}),async read(){throw new Error('GitHub sync 尚未啟用，請先設定 OAuth Worker。')},async write(){throw new Error('GitHub sync 尚未啟用，請先設定 OAuth Worker。')}};
