import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; 
import { 
  Database, Code, Copy, CheckCircle, AlertCircle, Server, Lock, User, 
  LogOut, Play, Table as TableIcon, FileSpreadsheet, Shirt, 
  UtensilsCrossed, Search, Loader2, Home, Save, Unlock, Lock as LockIcon
} from 'lucide-react';

// --- FUNCIÓN SQL DE SOPORTE (SE EJECUTA AL CONECTAR) ---
const CREATE_FUNCTION_SQL = `
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[udf_decimal_a_base]') AND type in (N'FN', N'IF', N'TF', N'FS', N'FT'))
BEGIN
    EXEC('CREATE FUNCTION [dbo].[udf_decimal_a_base](@N bigint, @Base int)
    RETURNS varchar(200)
    AS
    BEGIN
        DECLARE @Result varchar(200), @NumChars varchar(50)
        SET @NumChars = ''0123456789ABCDEF''
        SET @Result =''''
        IF ( (@Base = 2) OR (@Base = 8) OR (@Base = 10) OR (@Base = 16) )
        BEGIN
            WHILE ( @N > 0 )
            BEGIN
                SET @Result = SUBSTRING(@NumChars,(@N % @Base) + 1,1) + @Result
                SET @N = FLOOR(@N / @Base)
            END
        END
        RETURN @Result
    END')
END`;

// --- PLANTILLA SQL ÁGORA (V2.2 ÍNTEGRA) ---
const AGORA_SQL_TEMPLATE = `DECLARE @IDTAFVENTA INT = {TARIFF_ID};

SELECT distinct
CASE
	WHEN REPLACE(replace(sec.DESCRIPCION,'SECCION ',''),'SECCIÓN ','') IS NULL THEN ''
	ELSE REPLACE(replace(sec.DESCRIPCION,'SECCION ',''),'SECCIÓN ','') 
END AS 'Familia',
CASE 
	WHEN favo.Categorias IS NULL THEN ''
	ELSE favo.Categorias 
END as 'Categorías',
'' as 'Alérgenos',
'' as 'Etiquetas',
TRIM(REPLACE(art.DESCRIPCION, '"', '')) as 'Producto',
case 
	when fo.DESCRIPCION is null then ''
	else fo.DESCRIPCION+' '+TRIM(REPLACE(art.DESCRIPCION, '"', ''))
end as 'Formato',
case 
	when pv1.CODFORMATO=0 then '' 
	else replace(cast(form.DOSIS1 as varchar),'.',',') 
end as 'Ratio',
'' as 'Código Barras',
'' as 'PLU',
case
	when pv1.CODFORMATO=0 then replace(CAST(art.ultimocoste AS VARCHAR),'.',',')
	else REPLACE('ASISMAN','ASISMAN','') 
end as 'Precio Coste',
case
	when pv1.CODFORMATO=0 then CAST(tta.PORCENTAJE AS VARCHAR) 
	else REPLACE('ASISMAN','ASISMAN','') 
end as '% Impuesto',
case
	when pv1.CODFORMATO=0 then CAST(ttacomp.PORCENTAJE AS VARCHAR) 
	else REPLACE('ASISMAN','ASISMAN','') 
end as '% Impuesto Compra',
case 
	when fo.DESCRIPCION is null THEN 'Unidad'
	else ''
end as 'Unidad de Compra',
case 
	when art.USASTOCKS='T' and pv1.CODFORMATO=0 THEN 'Sí'
	else 'No'
end as 'Control Stock',
case 
	when fo.DESCRIPCION is null THEN 'Unidad'
	else ''
end as 'Unidad de Medida',
'Sí' as 'Vendible Principal',
'No' as 'Vendible Añadido',
case
	when art.PORPESO='F' THEN 'No'
	else 'Sí' 
end as 'Venta Peso',
case
	when art.COLORFONDO>0 then '#'+left('000000',6-len([dbo].[udf_decimal_a_base](art.colorfondo,16)))+[dbo].[udf_decimal_a_base](art.colorfondo,16) 
	else ''
end as 'Color',
case
	when fo.DESCRIPCION is null then art.DESCRIPCION
	else fo.DESCRIPCION+' '+art.DESCRIPCION
end as 'Texto Botón',
'' as 'Imagen',
case 
	when art.ORDEN!=0 AND pv1.CODFORMATO=0 and situart.impcocinaart is not null then situart.impcocinaart
	when art.ORDEN!=0 AND pv1.CODFORMATO=0 and situart.impcocinaart is null and situ.impcocina is not null then situ.impcocina 
	when art.ORDEN!=0 AND pv1.CODFORMATO=0 and situart.impcocinaart is null and situ.impcocina is null then 'SIN SITUACION'
else '' end as 'Tipo de Preparación',
case 
	when pv1.CODFORMATO=0 and art.ORDEN=1 then 'PRIMEROS' 
	when pv1.CODFORMATO=0 and art.ORDEN=2 then 'SEGUNDOS'
	when pv1.CODFORMATO=0 and art.ORDEN=3 then 'TERCEROS'
	when pv1.CODFORMATO=0 and art.ORDEN=4 then 'CUARTOS'
	when pv1.CODFORMATO=0 and art.ORDEN=5 then 'QUINTOS'
	when pv1.CODFORMATO=0 and art.ORDEN=6 then 'SEXTOS'
	when pv1.CODFORMATO=0 and art.ORDEN=7 then 'SEPTIMOS'
	when pv1.CODFORMATO=0 and art.ORDEN=8 then 'OCTAVOS'
	when pv1.CODFORMATO=0 and art.ORDEN=9 then 'NOVENOS'
	when pv1.CODFORMATO=0 and art.ORDEN=10 then 'DECIMOS'
	WHEN pv1.CODFORMATO>0 then ''
else '' end as 'Orden de Preparación',
case 
	when fo.DESCRIPCION is null then art.DESCRIPCION
	else fo.DESCRIPCION+' '+art.DESCRIPCION
end as 'Texto Documento',
case 
	when fo.DESCRIPCION is null then art.DESCRIPCION
	else fo.DESCRIPCION+' '+art.DESCRIPCION
end as 'Texto Comanda',
'' as 'Texto Ficha',
'' as 'Imagen Ficha',
case 
	when (pv1.DESDE2 <= GETDATE() AND PV1.HASTA2 >= GETDATE()) AND PV1.VALOR2 is null AND PV1.VALOR IS NULL then 0 
	when (pv1.DESDE2 <= GETDATE() AND PV1.HASTA2 >= GETDATE()) AND PV1.VALOR2 is null AND PV1.VALOR IS NOT NULL then PV1.VALOR 
	when (pv1.DESDE2 <= GETDATE() AND PV1.HASTA2 >= GETDATE()) AND PV1.VALOR2 is NOT null then PV1.VALOR2 
	when (pv1.DESDE2 > GETDATE() OR PV1.HASTA2 < GETDATE()) AND PV1.VALOR is null then 0 
	else pv1.VALOR 
end as 'PP PVP',
0 as 'PA PVP',
0 as 'PM PVP'

FROM PRECIOSVENTA pv1
left join ARTICULOS ART on pv1.CODARTICULO=art.CODARTICULO
left join formatos fo on pv1.CODFORMATO=fo.CODFORMATO
left join SECCIONES sec on art.DPTO=sec.DPTO and art.SECCION=sec.SECCION
left join(SELECT sitf.[CODSECCION],STRING_AGG(sit.descripcion,',' )as impcocina
		  FROM SITUACIONESFAMILIA sitf LEFT JOIN situaciones sit ON sitf.CODSITUACION=sit.CODSITUACION
		  GROUP BY sitf.CODSECCION) situ on art.SECCION=situ.CODSECCION
left join(SELECT  [CODARTICULO],STRING_AGG(sit.DESCRIPCION,',')as impcocinaart
		  FROM SITUACIONESARTICULO sitf LEFT JOIN situaciones sit ON sitf.CODSITUACION=sit.CODSITUACION
		  GROUP BY sitf.CODARTICULO)situart on art.CODARTICULO=situart.CODARTICULO
left join FORMATOS FORM on pv1.CODFORMATO=form.CODFORMATO
left join (SELECT CODARTICULO, STRING_AGG(tpf.DESCRIPCION, ',') as Categorias 
		   FROM favoritos fav LEFT JOIN TIPOFAVORITOS TPF ON FAV.CODFAVORITO=TPF.CODFAVORITO
		   where fav.CODFAVORITO in (select distinct CODFAVORITO from FAVORITOSTIPOSTERMINAL)
		   GROUP BY CODARTICULO)favo on art.CODARTICULO=favo.CODARTICULO
left join TASAS ta on art.CODTASA1=ta.CODTASA
left join TIPOTASAS tta on ta.CODTIPOTASA1=tta.CODTIPOTASA
left join TASAS tacomp on art.CODTASA1C=tacomp.CODTASA
left join TIPOTASAS ttacomp on tacomp.CODTIPOTASA1=ttacomp.CODTIPOTASA

WHERE ((pv1.IDTARIFAV=@IDTAFVENTA and PV1.DESCATALOGADO=0))
	AND art.DESCATALOGADO='F'

UNION

SELECT distinct
CASE
	WHEN REPLACE(replace(sec.DESCRIPCION,'SECCION ',''),'SECCIÓN ','') IS NULL THEN ''
	ELSE REPLACE(replace(sec.DESCRIPCION,'SECCION ',''),'SECCIÓN ','') 
END AS 'Familia',
CASE 
	WHEN favo.Categorias IS NULL THEN ''
	ELSE favo.Categorias 
END as 'Categorías',
'' as 'Alérgenos',
'' as 'Etiquetas',
TRIM(REPLACE(art.DESCRIPCION, '"', '')) as 'Producto',
 '' as 'Formato',
'' as 'Ratio',
'' as 'Código Barras',
'' as 'PLU',
CAST(art.ultimocoste AS VARCHAR) as 'Precio Coste',
CAST(TTA.PORCENTAJE AS VARCHAR) as '% Impuesto',
CAST(ttacomp.PORCENTAJE AS VARCHAR) as '% Impuesto Compra',
'Unidad' as 'Unidad de Compra',
case 
	when art.USASTOCKS='T' THEN 'Sí'
	else 'No'
end as 'Control Stock',
'Unidad' as 'Unidad de Medida',
'No' as 'Vendible Principal',
'No' as 'Vendible Añadido',
'No'as 'Venta Peso',
case
	when art.COLORFONDO>0 then '#'+left('000000',6-len([dbo].[udf_decimal_a_base](art.colorfondo,16)))+[dbo].[udf_decimal_a_base](art.colorfondo,16) 
	else ''
end as 'Color',
art.DESCRIPCION as 'Texto Botón',
'' as 'Imagen',
case 
	when art.ORDEN!=0 AND pv1.CODFORMATO=0 and situart.impcocinaart is not null then situart.impcocinaart
	when art.ORDEN!=0 AND pv1.CODFORMATO=0 and situart.impcocinaart is null and situ.impcocina is not null then situ.impcocina 
	when art.ORDEN!=0 AND pv1.CODFORMATO=0 and situart.impcocinaart is null and situ.impcocina is null then 'SIN SITUACION'
	else '' end as 'Tipo de Preparación',
case 
	when pv1.CODFORMATO=0 and art.ORDEN=1 then 'PRIMEROS' 
	when pv1.CODFORMATO=0 and art.ORDEN=2 then 'SEGUNDOS'
	when pv1.CODFORMATO=0 and art.ORDEN=3 then 'TERCEROS'
	when pv1.CODFORMATO=0 and art.ORDEN=4 then 'CUARTOS'
	when pv1.CODFORMATO=0 and art.ORDEN=5 then 'QUINTOS'
	when pv1.CODFORMATO=0 and art.ORDEN=6 then 'SEXTOS'
	when pv1.CODFORMATO=0 and art.ORDEN=7 then 'SEPTIMOS'
	when pv1.CODFORMATO=0 and art.ORDEN=8 then 'OCTAVOS'
	when pv1.CODFORMATO=0 and art.ORDEN=9 then 'NOVENOS'
	WHEN pv1.CODFORMATO>0 then ''
else '' end as 'Orden de Preparación',
art.DESCRIPCION  as 'Texto Documento',
art.DESCRIPCION  as 'Texto Comanda',
'' as 'Texto Ficha',
'' as 'Imagen Ficha',
0 as 'PP PVP',
0 as 'PA PVP',
0 as 'PM PVP'

FROM PRECIOSVENTA pv1
left join ARTICULOS ART on pv1.CODARTICULO=art.CODARTICULO
left join formatos fo on pv1.CODFORMATO=fo.CODFORMATO
left join FORMATOS FORM on pv1.CODFORMATO=form.CODFORMATO
left join SECCIONES sec on art.DPTO=sec.DPTO and art.SECCION=sec.SECCION
left join(SELECT sitf.[CODSECCION],STRING_AGG(sit.descripcion,',' )as impcocina
		  FROM SITUACIONESFAMILIA sitf LEFT JOIN situaciones sit ON sitf.CODSITUACION=sit.CODSITUACION
		  GROUP BY sitf.CODSECCION)situ on art.SECCION=situ.CODSECCION
left join(SELECT  [CODARTICULO],STRING_AGG(sit.DESCRIPCION,',')as impcocinaart
		  FROM SITUACIONESARTICULO sitf LEFT JOIN situaciones sit ON sitf.CODSITUACION=sit.CODSITUACION
		  GROUP BY sitf.CODARTICULO)situart on art.CODARTICULO=situart.CODARTICULO
left join(SELECT CODARTICULO, STRING_AGG(tpf.DESCRIPCION, ',') as Categorias 
		  FROM favoritos fav LEFT JOIN TIPOFAVORITOS TPF ON FAV.CODFAVORITO=TPF.CODFAVORITO
		  where fav.CODFAVORITO in (select distinct CODFAVORITO from FAVORITOSTIPOSTERMINAL)
		  GROUP BY CODARTICULO)favo on art.CODARTICULO=favo.CODARTICULO
left join TASAS ta on art.CODTASA1=ta.CODTASA
left join TIPOTASAS tta on ta.CODTIPOTASA1=tta.CODTIPOTASA
left join TASAS tacomp on art.CODTASA1C=tacomp.CODTASA
left join TIPOTASAS ttacomp on tacomp.CODTIPOTASA1=ttacomp.CODTIPOTASA

WHERE ((pv1.IDTARIFAV=@IDTAFVENTA and PV1.DESCATALOGADO=0))
	and art.DESCATALOGADO='F' 
	and art.CODARTICULO in (SELECT distinct art.CODARTICULO as Producto
							FROM PRECIOSVENTA pv1 left join ARTICULOS ART on pv1.CODARTICULO=art.CODARTICULO
								left join formatos fo on pv1.CODFORMATO=fo.CODFORMATO
								left join SECCIONES sec on art.DPTO=sec.DPTO and art.SECCION=sec.SECCION
								left join (	SELECT CODARTICULO, STRING_AGG(tpf.DESCRIPCION, ',') as Categorias 
											FROM favoritos fav LEFT JOIN TIPOFAVORITOS TPF ON FAV.CODFAVORITO=TPF.CODFAVORITO
											where fav.CODFAVORITO in (select distinct CODFAVORITO from FAVORITOSTIPOSTERMINAL)
											GROUP BY CODARTICULO)favo on art.CODARTICULO=favo.CODARTICULO
								left join PRECIOSVENTA pv2 on art.CODARTICULO=pv2.CODARTICULO and pv1.CODFORMATO=pv2.CODFORMATO
								left join PRECIOSVENTA pv3 on art.CODARTICULO=pv3.CODARTICULO and pv1.CODFORMATO=pv3.CODFORMATO
								left join TASAS ta on art.CODTASA1=ta.CODTASA
								left join TIPOTASAS tta on ta.CODTIPOTASA1=tta.CODTIPOTASA
								left join TASAS tacomp on art.CODTASA1C=tacomp.CODTASA
								left join TIPOTASAS ttacomp on tacomp.CODTIPOTASA1=ttacomp.CODTIPOTASA
							where ((pv1.IDTARIFAV=@IDTAFVENTA and PV1.DESCATALOGADO=0)
								AND (art.DESCATALOGADO='F' and pv1.CODFORMATO>0))
							)
ORDER BY Producto`;

// --- PLANTILLA SQL STOCKAGILE (ÍNTEGRA) ---
const STOCKAGILE_SQL_TEMPLATE = `DECLARE @IDTAFVENTA INT = {TARIFF_ID};

select distinct
art.codarticulo as 'Código', 
case
	when art.DESCRIPCION = '' or art.DESCRIPCION is null then '~NO_NAME'
	ELSE TRIM(REPLACE(art.DESCRIPCION, '"', ''))
end as 'Nombre',
'' as 'Categoría de talla (nombre)',
'' as 'Categoría de talla (código)',
ARTL.TALLA as 'Talla (nombre)',
'' as 'Talla (código)',
'' as 'Categoría de color (nombre)',
'' as 'Categoría de color (código)',
ARTL.COLOR as 'Color (nombre)',
'' as 'Color (código)',
CONCAT(art.CODARTICULO,'-',artl.TALLA,'-',artl.COLOR) as 'SKU',
CASE 
	WHEN artl.CODBARRAS IS NULL OR ARTL.CODBARRAS = '' THEN CONCAT('~NO_CODE_', ART.CODARTICULO, ARTL.TALLA, ARTL.COLOR)
	ELSE trim(ARTL.CODBARRAS)
END as 'Código de barras',
case
	when M.DESCRIPCION is null then ''
	else M.DESCRIPCION
end AS 'Marca (nombre)',
case
	when cast(m.CODMARCA as varchar) is null then ''
	else cast(m.CODMARCA as varchar)
end as 'Marca (código)',
case
	when T.TEMPORADA is null then ''
	else T.TEMPORADA
end as 'Temporada (nombre)',
case
	when cast(T.CODTEMPORADA as varchar) is null then ''
	else cast(T.CODTEMPORADA as varchar)
end as 'Temporada (código)',
case
	when d.DESCRIPCION is null then '~NO_DPTO'
	ELSE trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ',''))
END AS 'Categoría (nombre)', 
'' as 'Categoría (código)',
CASE
	WHEN S.DESCRIPCION IS NULL THEN '~NO_SECCION'
	ELSE trim(REPLACE(replace(s.DESCRIPCION,'SECCION ',''),'SECCIÓN ',''))
END AS 'Subcategoría (nombre)', 
'' as 'Subcategoría (código)',
'' as 'Etiquetas',
'' as 'Composición',
CASE
	WHEN prov.NOMPROVEEDOR IS NULL THEN '~NO_PROV'
	ELSE prov.NOMPROVEEDOR
END as 'Proveedor',
art.REFPROVEEDOR as 'Código de origen', 
'' as 'Precio DDP (producto)',
'' as 'Precio DDP (variante)',
pv.PBRUTO as 'PP PVP',
pv.PNETO as 'PA PVP',
case
	when pv.PBRUTO<>pv.PNETO then 'VERDADERO'
	ELSE 'FALSO'
end as '¿El precio de variante es de descuento?',
CASE
	WHEN CAST(PV.PBRUTO2 AS VARCHAR) IS NULL OR PV.PBRUTO2 = 0 THEN ''
	ELSE CAST(PV.PBRUTO2 AS VARCHAR)
END as 'Precio descuento con impuestos (producto)',
CASE
	WHEN CAST(PV.PNETO2 AS VARCHAR) IS NULL OR PV.PNETO2 = 0 THEN ''
	ELSE CAST(PV.PNETO2 AS VARCHAR)
END as 'Precio descuento con impuestos (variante)',
IMPV.IVA as 'Tipo de impuesto',
case
	when ST.STOCK is null then 0
	else ST.STOCK
end as 'Existencias',
case
	when art.DESCRIPCION = '' or art.DESCRIPCION is null then '~NO_NAME'
	ELSE TRIM(REPLACE(art.DESCRIPCION, '"', ''))
end as 'Descripción',
'' as 'Descripción larga',
'' as 'Imágenes',
'' as 'Categorías Web',
'' as 'Id externo del canal',
'' as 'Atributos dinámicos',
'' as 'Ancho',
'' as 'Altura',
'' as 'Profundidad',
'' as 'Peso',
'' as 'Unidad de peso',
'' as 'Localización'

FROM ARTICULOS ART 
	LEFT JOIN SECCIONES s ON (ART.DPTO=s.NUMDPTO AND ART.SECCION=s.NUMSECCION)
	LEFT JOIN DEPARTAMENTO D ON (ART.DPTO=D.NUMDPTO)
	LEFT JOIN ARTICULOSLIN ARTL ON (ART.CODARTICULO = ARTL.CODARTICULO)
	LEFT JOIN PRECIOSVENTA PV ON (ARTL.CODARTICULO=PV.CODARTICULO and artl.TALLA=pv.TALLA and artl.COLOR=pv.COLOR)
	LEFT JOIN IMPUESTOS IMPV ON (ART.TIPOIMPUESTO=IMPV.TIPOIVA)
	LEFT JOIN MARCA M ON (ART.MARCA=M.CODMARCA)
	LEFT JOIN TEMPORADAS T ON (ART.TEMPORADA=T.TEMPORADA)
	left join REFERENCIASPROV refs on (art.REFPROVEEDOR=refs.REFPROVEEDOR and art.CODARTICULO=refs.CODARTICULO)
	left join PROVEEDORES prov on (refs.CODPROVEEDOR=prov.CODPROVEEDOR)
	LEFT JOIN STOCKS ST ON (ST.CODARTICULO = ARTL.CODARTICULO AND ST.TALLA = ARTL.TALLA AND ST.COLOR = ARTL.COLOR)

where ART.DESCATALOGADO = 'F' 
	and art.CODARTICULO > 0
	AND PV.IDTARIFAV = @IDTAFVENTA

GROUP BY s.DESCRIPCION, D.DESCRIPCION,
art.DESCRIPCION, art.COLORFONDO, ART.CODARTICULO, art.USASTOCKS, art.PORPESO,
artl.TALLA, artl.COLOR, artl.CODBARRAS,
prov.NOMPROVEEDOR, art.REFPROVEEDOR, 
m.codmarca, m.DESCRIPCION, t.CODTEMPORADA, t.TEMPORADA, IMPV.IVA, PV.PBRUTO, PV.PNETO, PV.PBRUTO2, PV.PNETO2, ST.STOCK`;

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [dbConfig, setDbConfig] = useState({ server: 'LOCALHOST\\SQLEXPRESS22', user: 'sa', password: '', database: 'DBFREST' });
  const [selectedProgram, setSelectedProgram] = useState('agora');
  const [configs] = useState({
    agora: { name: 'Ágora (Exportación ICG)', icon: UtensilsCrossed, template: AGORA_SQL_TEMPLATE, desc: 'Plantilla completa V2.2 con UNION', tariffQuery: 'SELECT * FROM TARIFASVENTA' },
    stockagile: { name: 'StockAgile (Retail)', icon: Shirt, template: STOCKAGILE_SQL_TEMPLATE, desc: 'Plantilla Completa de Variantes', tariffQuery: 'SELECT * FROM TARIFASVENTA' }
  });
  
  const [selectedTariff, setSelectedTariff] = useState(1);
  const [selectedTariffName, setSelectedTariffName] = useState('PVP');
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [availableTariffs, setAvailableTariffs] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [executionMessage, setExecutionMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('asisman_sql_config');
    if (saved) setDbConfig(JSON.parse(saved));
  }, []);

  const saveLocalConfig = () => {
    localStorage.setItem('asisman_sql_config', JSON.stringify({ ...dbConfig, password: '' }));
    alert("Preferencias guardadas.");
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectError('');
    try {
      const response = await window.electronAPI.connectDB(dbConfig);
      if (response.success) {
        await window.electronAPI.executeSQL(CREATE_FUNCTION_SQL);
        setIsConnected(true);
      } else setConnectError(response.message);
    } catch (err) { setConnectError(err.message); }
    finally { setIsConnecting(false); }
  };

  const handleExecuteSQL = async () => {
    setIsExecuting(true);
    setExecutionMessage('');
    try {
      const response = await window.electronAPI.executeSQL(generatedSQL);
      if (response.success) {
        setQueryResults(response.data);
        setExecutionMessage(`Éxito: ${response.data.length} registros extraídos.`);
      } else setExecutionMessage(`Error SQL: ${response.message}`);
    } catch (err) { setExecutionMessage(err.message); }
    finally { setIsExecuting(false); }
  };

  const handleExportExcel = () => {
    if (!queryResults) return;
    const ws = XLSX.utils.json_to_sheet(queryResults);
    const colWidths = Object.keys(queryResults[0]).map(key => {
        const maxLen = Math.max(key.length, ...queryResults.slice(0, 100).map(row => String(row[key] || "").length));
        return { wch: maxLen + 2 };
    });
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, `Export_${selectedProgram}_${selectedTariffName.replace(/\s/g, '_')}.xlsx`);
  };

  useEffect(() => {
    if (isExpertMode) return;
    const conf = configs[selectedProgram];
    let template = conf.template.replace(/{TARIFF_ID}/g, selectedTariff);
    const cleanName = String(selectedTariffName).replace(/'/g, "''").trim();
    template = template.replace(/'PP PVP'/g, `'PP ${cleanName}'`).replace(/'PA PVP'/g, `'PA ${cleanName}'`).replace(/'PM PVP'/g, `'PM ${cleanName}'`);
    setGeneratedSQL(template);
  }, [selectedProgram, selectedTariff, selectedTariffName, isExpertMode]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border">
          <div className="bg-blue-600 p-6 text-center text-white"><Database className="w-16 h-16 mx-auto mb-3" /><h1 className="text-2xl font-bold tracking-tight">Asisman Exporter</h1></div>
          <form onSubmit={handleConnect} className="p-8 space-y-4">
            {connectError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs border border-red-100 font-bold">{connectError}</div>}
            <div className="space-y-4">
                <input type="text" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Servidor SQL" value={dbConfig.server} onChange={(e) => setDbConfig({...dbConfig, server: e.target.value})} />
                <input type="text" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Base de Datos" value={dbConfig.database} onChange={(e) => setDbConfig({...dbConfig, database: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" className="p-3 border rounded-lg" placeholder="Usuario" value={dbConfig.user} onChange={(e) => setDbConfig({...dbConfig, user: e.target.value})} />
                    <input type="password" name="password" className="p-3 border rounded-lg" placeholder="Contraseña" value={dbConfig.password} onChange={(e) => setDbConfig({...dbConfig, password: e.target.value})} />
                </div>
            </div>
            <button type="submit" disabled={isConnecting} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-colors">{isConnecting ? <Loader2 className="animate-spin" /> : "CONECTAR A SQL SERVER"}</button>
            <button type="button" onClick={saveLocalConfig} className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-black flex justify-center items-center gap-2 hover:bg-slate-200 uppercase tracking-widest"><Save size={14}/> Recordar Servidor</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 font-bold text-slate-800 uppercase text-sm tracking-tight"><Server size={20} className="text-blue-600" /> {dbConfig.server} <span className="text-slate-300">|</span> {dbConfig.database}</div>
        <button onClick={() => setIsConnected(false)} className="text-red-600 font-black px-4 py-2 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-all uppercase text-xs tracking-widest"><LogOut size={16} /> Cerrar Sesión</button>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        <div className="col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2"><CheckCircle size={12}/> 1. Origen de Datos</h2>
            <div className="space-y-2">
              {Object.entries(configs).map(([key, conf]) => (
                <button key={key} onClick={() => {setSelectedProgram(key); setAvailableTariffs([]); setSelectedTariffName('PVP');}} className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${selectedProgram === key ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className={`p-2 rounded-full ${selectedProgram === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}><conf.icon size={18} /></div>
                  <span className={`font-bold text-sm ${selectedProgram === key ? 'text-blue-700' : 'text-slate-600'}`}>{conf.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle size={12}/> 2. Tarifa</h2>
                <button onClick={async () => {
                    const res = await window.electronAPI.executeSQL(configs[selectedProgram].tariffQuery);
                    if (res.success) setAvailableTariffs(res.data.map(r => ({ id: r.IDTARIFAV || r.CODTARIFA || 0, nombre: r.DESCRIPCION || r.NOMBRE || 'Tarifa' })));
                }} className="text-blue-600 text-[10px] font-black px-3 py-1 bg-blue-50 rounded-full hover:bg-blue-100 transition-all uppercase tracking-tighter">Cargar Listado</button>
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {availableTariffs.map(t => (
                <button key={t.id} onClick={() => {setSelectedTariff(t.id); setSelectedTariffName(t.nombre);}} className={`p-3 text-xs font-bold rounded-lg border text-left transition-all ${selectedTariff === t.id ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"}`}>{t.nombre}</button>
              ))}
            </div>
          </div>

          <button onClick={handleExecuteSQL} disabled={isExecuting} className={`w-full py-5 rounded-xl font-black text-white shadow-xl flex justify-center items-center gap-2 transition-all transform active:scale-95 ${isExecuting ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200'}`}>
            {isExecuting ? <div className="flex flex-col items-center"><Loader2 className="animate-spin" /> <span className="text-[10px] mt-1 tracking-widest">EJECUTANDO CONSULTA...</span></div> : <><Play fill="currentColor" size={20}/> EJECUTAR EXTRACCIÓN</>}
          </button>
        </div>

        <div className="col-span-8 space-y-6">
          <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[380px] border border-slate-800">
            <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2 text-white font-mono text-[10px] font-black uppercase tracking-widest"><Code size={14} className="text-blue-400" /> Script SQL Generado</div>
                <button onClick={() => setIsExpertMode(!isExpertMode)} className={`px-4 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-sm ${isExpertMode ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>
                    {isExpertMode ? <Unlock size={12}/> : <LockIcon size={12}/>} {isExpertMode ? 'Modo Experto Activado' : 'Editor Bloqueado'}
                </button>
            </div>
            <textarea 
                className={`flex-1 p-6 font-mono text-[11px] outline-none resize-none transition-all leading-relaxed ${isExpertMode ? "bg-slate-800 text-white shadow-inner" : "bg-slate-900 text-emerald-400 opacity-80"}`}
                value={generatedSQL}
                readOnly={!isExpertMode}
                onChange={(e) => isExpertMode && setGeneratedSQL(e.target.value)}
                spellCheck="false"
            />
          </div>
          
          {executionMessage && <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-xs font-black flex items-center gap-3 uppercase tracking-tighter shadow-sm animate-in fade-in"><CheckCircle size={18}/> {executionMessage}</div>}

          {queryResults && (
            <div className="bg-white rounded-xl border shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <span className="font-black text-slate-700 text-xs uppercase tracking-widest flex items-center gap-2"><TableIcon size={16} className="text-blue-600"/> Resultados ({queryResults.length})</span>
                <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-[10px] font-black flex items-center gap-2 hover:bg-emerald-700 shadow-md transition-all active:scale-95 uppercase tracking-widest"><FileSpreadsheet size={14}/> Generar Excel Pro</button>
              </div>
              <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead className="bg-slate-100 sticky top-0 font-black text-slate-500 uppercase border-b shadow-sm z-10">
                    <tr>{Object.keys(queryResults[0]).map(k => <th key={k} className="p-4 whitespace-nowrap">{k}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queryResults.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 transition-colors text-slate-600 font-medium">
                        {Object.values(row).map((v, ci) => <td key={ci} className="p-4 whitespace-nowrap border-r border-slate-50/50">{v === null ? "" : String(v)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {queryResults.length > 50 && <div className="p-3 bg-slate-50 text-center text-[10px] text-slate-400 font-bold border-t italic">Previsualización limitada a 50 filas para rendimiento óptimo.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;