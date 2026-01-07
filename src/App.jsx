import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx'; 
import { 
  Database, Code, Copy, CheckCircle, AlertCircle, Server, Lock, User, 
  LogOut, Play, Table as TableIcon, FileSpreadsheet, Shirt, 
  UtensilsCrossed, Search, Loader2, Save, Unlock, Lock as LockIcon,
  ArrowRight, Clock, History, Trash2, Tag, Terminal, ShoppingCart, Store, ChevronDown,
  XCircle, Users, Truck
} from 'lucide-react';

// --- MODULARIZACIÓN DE PLANTILLAS SQL (INTEGRIDAD TOTAL SIN RECORTES) ---
const SQL_TEMPLATES = {
  agora_hosteleria: `DECLARE @IDTAFVENTA INT = {TARIFF_ID};

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
left join(SELECT sitf.[CODARTICULO],STRING_AGG(sit.DESCRIPCION,',')as impcocinaart
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
ORDER BY Producto`,
  agora_super: `DECLARE @IDTAFVENTA INT = {TARIFF_ID};

SELECT distinct
case
	when (trim(REPLACE(replace(s.DESCRIPCION,'SECCION ',''),'SECCIÓN ','')) is null OR trim(REPLACE(replace(s.DESCRIPCION,'SECCION ',''),'SECCIÓN ','')) = '') AND (trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ','')) is null or trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ','')) ='') then 'SIN FAMILIA'
	when (trim(REPLACE(replace(s.DESCRIPCION,'SECCION ',''),'SECCIÓN ','')) is null OR trim(REPLACE(replace(s.DESCRIPCION,'SECCION ',''),'SECCIÓN ','')) = '') AND (trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ','')) is not null or trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ','')) <> '') then trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ',''))
	ELSE CONCAT(trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ','')),' - ', trim(REPLACE(replace(s.DESCRIPCION,'SECCION ',''),'SECCIÓN ','')))
end as 'Familia',
CASE 
	WHEN favo.Categorias IS NULL THEN ''
	ELSE favo.Categorias 
END as 'Categorías',
'' as 'Alérgenos',
'' as 'Etiquetas',
case
	when art.DESCRIPCION = '' or art.DESCRIPCION is null then '~NO_NAME'
	ELSE TRIM(art.DESCRIPCION)
end as 'Producto',
'' as 'Formato',
'' AS 'Tallas',
'' AS 'Colores',
'' as 'Ratio',
CASE 
	WHEN (ARTL.CODBARRAS IS NULL OR ARTL.CODBARRAS = '') AND (ARTL.CODBARRAS2 IS NULL OR ARTL.CODBARRAS2 = '') AND (ARTL.CODBARRAS3 IS NULL OR ARTL.CODBARRAS3 = '') THEN ''
	WHEN (ARTL.CODBARRAS IS NOT NULL OR ARTL.CODBARRAS <> '') AND (ARTL.CODBARRAS2 IS NULL OR ARTL.CODBARRAS2 = '') AND (ARTL.CODBARRAS3 IS NULL OR ARTL.CODBARRAS3 = '') THEN ARTL.CODBARRAS
	WHEN (ARTL.CODBARRAS IS NULL OR ARTL.CODBARRAS = '') AND (ARTL.CODBARRAS2 IS NOT NULL OR ARTL.CODBARRAS2 <> '') AND (ARTL.CODBARRAS3 IS NULL OR ARTL.CODBARRAS3 = '') THEN ARTL.CODBARRAS2
	WHEN (ARTL.CODBARRAS IS NULL OR ARTL.CODBARRAS = '') AND (ARTL.CODBARRAS2 IS NULL OR ARTL.CODBARRAS2 = '') AND (ARTL.CODBARRAS3 IS NOT NULL OR ARTL.CODBARRAS3 <> '') THEN ARTL.CODBARRAS3
	WHEN (ARTL.CODBARRAS IS NOT NULL OR ARTL.CODBARRAS <> '') AND (ARTL.CODBARRAS2 IS NOT NULL OR ARTL.CODBARRAS2 <> '') AND (ARTL.CODBARRAS3 IS NULL OR ARTL.CODBARRAS3 = '') THEN CONCAT(ARTL.CODBARRAS,', ',ARTL.CODBARRAS2)
	WHEN (ARTL.CODBARRAS IS NULL OR ARTL.CODBARRAS = '') AND (ARTL.CODBARRAS2 IS NOT NULL OR ARTL.CODBARRAS2 <> '') AND (ARTL.CODBARRAS3 IS NOT NULL OR ARTL.CODBARRAS3 <> '') THEN CONCAT(ARTL.CODBARRAS2,', ',ARTL.CODBARRAS3)
	WHEN (ARTL.CODBARRAS IS NOT NULL OR ARTL.CODBARRAS <> '') AND (ARTL.CODBARRAS2 IS NULL OR ARTL.CODBARRAS2 = '') AND (ARTL.CODBARRAS3 IS NOT NULL OR ARTL.CODBARRAS3 <> '') THEN CONCAT(ARTL.CODBARRAS,', ',ARTL.CODBARRAS3)
	ELSE CONCAT(ARTL.CODBARRAS,', ',ARTL.CODBARRAS2,', ',ARTL.CODBARRAS3)
END as 'Código Barras',
ART.CODARTICULO as 'PLU',
ARTL.PRECIOULTCOMPRA as 'Precio Coste',
IMPV.IVA as '% Impuesto',
IMPC.IVA as '% Impuesto Compra',
'Unidad' as 'Unidad de Compra',
CASE
	WHEN ART.USASTOCKS = 'T' THEN 'Sí'
	else 'No'
end as 'Control Stock',
'Unidad' as 'Unidad de Medida',
'Sí' as 'Vendible Principal',
'No' as 'Vendible Añadido',
case
	when art.PORPESO = 'T' then 'Sí'
	else 'No'
end as 'Venta Peso',
case
	when art.COLORFONDO>0 then '#'+left('000000',6-len([dbo].[udf_decimal_a_base](art.colorfondo,16)))+[dbo].[udf_decimal_a_base](art.colorfondo,16) 
	else ''
end as 'Color',
case
	when art.DESCRIPCION = '' or art.DESCRIPCION is null then '~NO_NAME'
	ELSE TRIM(art.DESCRIPCION)
end as 'Texto Botón',
'' as 'Imagen',
'' as 'Tipo de Preparación',
'' as 'Orden de Preparación',
'' as 'Tiempo Preparación (minutos)',
'' as 'Tiempo Preaviso (minutos)',
case
	when art.DESCRIPCION = '' or art.DESCRIPCION is null then '~NO_NAME'
	ELSE TRIM(art.DESCRIPCION)
end as 'Texto Documento',
case
	when art.DESCRIPCION = '' or art.DESCRIPCION is null then '~NO_NAME'
	ELSE TRIM(art.DESCRIPCION)
end as 'Texto Comanda',
'' as 'Texto Ficha',
'' as 'Imagen Ficha',
REPLACE(CAST(CAST(VENTA.[Precio Venta Max] AS DECIMAL (6,2))AS NVARCHAR(7)),'.',',')  as 'PP PVP',
'' as 'PA PVP'

FROM ARTICULOS ART LEFT JOIN SECCIONES s ON (ART.DPTO=s.NUMDPTO AND ART.SECCION=s.NUMSECCION)
	LEFT JOIN DEPARTAMENTO D ON (ART.DPTO=D.NUMDPTO)
	LEFT JOIN ARTICULOSLIN ARTL ON (ART.CODARTICULO = ARTL.CODARTICULO)
	LEFT JOIN PRECIOSVENTA PV ON (ART.CODARTICULO=PV.CODARTICULO)
	LEFT JOIN IMPUESTOS IMPV ON (ART.TIPOIMPUESTO=IMPV.TIPOIVA)
	LEFT JOIN IMPUESTOS IMPC ON (ART.IMPUESTOCOMPRA=IMPC.TIPOIVA)
	LEFT JOIN (SELECT flin.CODARTICULO, STRING_AGG(fcab.DESCRIPCION, ',') as 'Categorias'
				FROM FAVORITOSLIN flin LEFT JOIN favoritoscab fcab ON flin.CODFAVORITO=fcab.CODFAVORITO
				GROUP BY CODARTICULO) favo on art.CODARTICULO=favo.CODARTICULO
    OUTER APPLY ( --listado de tallas separados por comas
        SELECT STRING_AGG ( CONVERT ( NVARCHAR ( MAX ), tal.TALLA ), ', ' ) AS 'TALLAS' 
        FROM (
            SELECT distinct 
			art.codarticulo, 
			case
				when trim(artl1.talla) = '.' then '~NO_TALLA'
				else REPLACE(trim(artl1.talla),',','.')  --reemplaza las comas para no generar conflictos al importar las tallas en Ágora (separador = ,)
			end as 'talla'
            FROM articuloslin AS artl1
            WHERE artl1.CODARTICULO = art.CODARTICULO
            ) as tal
		group by tal.CODARTICULO
    ) AS TA
    OUTER APPLY ( --listado de colores separados por comas
        SELECT STRING_AGG ( CONVERT ( NVARCHAR ( MAX ), COL.COLOR ), ', ' ) AS 'COLORES' 
        FROM (
            SELECT distinct 
			art.codarticulo,
			case
				when trim(artl2.COLOR) = '.' then '~NO_COLOR'
				else REPLACE(trim(artl2.COLOR),',','.') --reemplaza las comas para no generar conflictos al importar los colores en Ágora (separador = ,)
			end as 'color'
            FROM articuloslin AS artl2
            WHERE artl2.CODARTICULO = art.CODARTICULO
            ) as COL
		group by COL.CODARTICULO
    ) AS CO
	OUTER APPLY ( --obtención de coste medio de todas las tallas y colores
		SELECT ARTL3.CODARTICULO, AVG(ARTL3.COSTEMEDIO) AS 'Precio Coste' 
		FROM ARTICULOSLIN ARTL3 
		WHERE ARTL3.CODARTICULO = ART.CODARTICULO 
		GROUP BY ARTL3.CODARTICULO
	) AS COSTE
	OUTER APPLY ( --obtención del precio de venta máximo, independientemente de la talla y color
		SELECT ART2.CODARTICULO, MAX(PV.PNETO) as 'Precio Venta Max'
		FROM ARTICULOS ART2 LEFT JOIN PRECIOSVENTA PV ON ART2.CODARTICULO=PV.CODARTICULO
		WHERE ART2.DESCATALOGADO = 'F' AND PV.DESCATALOGADO = 0 AND PV.IDTARIFAV = @IDTAFVENTA AND ART2.CODARTICULO=ART.CODARTICULO
		GROUP BY ART2.CODARTICULO
	) AS VENTA

WHERE ART.DESCATALOGADO = 'F' and art.CODARTICULO > 0

GROUP BY s.DESCRIPCION, D.DESCRIPCION, 
art.DESCRIPCION, art.COLORFONDO, ART.CODARTICULO, art.USASTOCKS, art.PORPESO, favo.Categorias,
ARTL.CODBARRAS,ARTL.CODBARRAS2,ARTL.CODBARRAS3, ARTL.PRECIOULTCOMPRA,
TA.TALLAS, CO.COLORES, 
IMPV.IVA, IMPC.IVA,  
VENTA.[Precio Venta Max]

HAVING REPLACE(CAST(CAST(VENTA.[Precio Venta Max] AS DECIMAL (6,2))AS NVARCHAR(7)),'.',',') IS NOT NULL`,
  agora_tienda: `DECLARE @IDTAFVENTA INT = {TARIFF_ID};

SELECT distinct
case
	when trim(REPLACE(replace(s.DESCRIPCION,'SECCION ',''),'SECCIÓN ','')) is null AND trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ','')) is null then 'SIN FAMILIA'
	when trim(REPLACE(replace(s.DESCRIPCION,'SECCION ',''),'SECCIÓN ','')) =''  AND trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ','')) ='' then 'SIN FAMILIA'
	when trim(REPLACE(replace(s.DESCRIPCION,'SECCION ',''),'SECCIÓN ','')) =''  AND trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ','')) IS NOT NULL then trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ',''))
	when trim(REPLACE(replace(s.DESCRIPCION,'SECCION ',''),'SECCIÓN ','')) =''  AND trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ','')) <>'' then trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ',''))
	ELSE CONCAT(trim(REPLACE(replace(D.DESCRIPCION,'DEPARTAMENTO ',''),'DPTO ','')),' - ', trim(REPLACE(replace(s.DESCRIPCION,'SECCION ',''),'SECCIÓN ','')))
end as 'Familia',
'' as 'Categorías',
'' as 'Alérgenos',
'' as 'Etiquetas',
case
	when art.DESCRIPCION = '' or art.DESCRIPCION is null then '~NO_NAME'
	ELSE TRIM(art.DESCRIPCION)
end as 'Producto',
'' as 'Formato',
CASE
	WHEN TA.TALLAS = '.' THEN '~NO_TALLA'
	ELSE TA.TALLAS
END AS 'Tallas',
CASE
	WHEN CO.COLORES = '.' THEN '~NO_COLOR'
	ELSE CO.COLORES
END AS 'Colores',
'' as 'Ratio',
'' as 'Código Barras',
ART.CODARTICULO as 'PLU',
COSTE.[Precio Coste] as 'Precio Coste',
IMPV.IVA as '% Impuesto',
IMPC.IVA as '% Impuesto Compra',
'Unidad' as 'Unidad de Compra',
CASE
	WHEN ART.USASTOCKS = 'T' THEN 'Sí'
	else 'No'
end as 'Control Stock',
'Unidad' as 'Unidad de Medida',
'Sí' as 'Vendible Principal',
'No' as 'Vendible Añadido',
case
	when art.PORPESO = 'T' then 'Sí'
	else 'No'
end as 'Venta Peso',
case
	when art.COLORFONDO>0 then '#'+left('000000',6-len([dbo].[udf_decimal_a_base](art.colorfondo,16)))+[dbo].[udf_decimal_a_base](art.colorfondo,16) 
	else ''
end as 'Color',
case
	when art.DESCRIPCION = '' or art.DESCRIPCION is null then '~NO_NAME'
	ELSE TRIM(art.DESCRIPCION)
end as 'Texto Botón',
'' as 'Imagen',
'' as 'Tipo de Preparación',
'' as 'Orden de Preparación',
'' as 'Tiempo Preparación (minutos)',
'' as 'Tiempo Preaviso (minutos)',
case
	when art.DESCRIPCION = '' or art.DESCRIPCION is null then '~NO_NAME'
	ELSE TRIM(art.DESCRIPCION)
end as 'Texto Documento',
case
	when art.DESCRIPCION = '' or art.DESCRIPCION is null then '~NO_NAME'
	ELSE TRIM(art.DESCRIPCION)
end as 'Texto Comanda',
'' as 'Texto Ficha',
'' as 'Imagen Ficha',
REPLACE(CAST(CAST(VENTA.[Precio Venta Max] AS DECIMAL (6,2))AS NVARCHAR(7)),'.',',')  as 'PP PVP1',
'' as 'PA PVP1'

FROM ARTICULOS ART LEFT JOIN SECCIONES s ON (ART.DPTO=s.NUMDPTO AND ART.SECCION=s.NUMSECCION)
	LEFT JOIN DEPARTAMENTO D ON (ART.DPTO=D.NUMDPTO)
	LEFT JOIN ARTICULOSLIN ARTL ON (ART.CODARTICULO = ARTL.CODARTICULO)
	LEFT JOIN PRECIOSVENTA PV ON (ART.CODARTICULO=PV.CODARTICULO)
	LEFT JOIN IMPUESTOS IMPV ON (ART.TIPOIMPUESTO=IMPV.TIPOIVA)
	LEFT JOIN IMPUESTOS IMPC ON (ART.IMPUESTOCOMPRA=IMPC.TIPOIVA)
    OUTER APPLY ( --listado de tallas separados por comas
        SELECT STRING_AGG ( CONVERT ( NVARCHAR ( MAX ), tal.TALLA ), ', ' ) AS 'TALLAS' 
        FROM (
            SELECT distinct 
			art.codarticulo, 
			case
				when trim(artl1.talla) = '.' then '~NO_TALLA'
				else REPLACE(trim(artl1.talla),',','.')  --reemplaza las comas para no generar conflictos al importar las tallas en Ágora (separador = ,)
			end as 'talla'
            FROM articuloslin AS artl1
            WHERE artl1.CODARTICULO = art.CODARTICULO
            ) as tal
		group by tal.CODARTICULO
    ) AS TA
    OUTER APPLY ( --listado de colores separados por comas
        SELECT STRING_AGG ( CONVERT ( NVARCHAR ( MAX ), COL.COLOR ), ', ' ) AS 'COLORES' 
        FROM (
            SELECT distinct 
			art.codarticulo,
			case
				when trim(artl2.COLOR) = '.' then '~NO_COLOR'
				else REPLACE(trim(artl2.COLOR),',','.') --reemplaza las comas para no generar conflictos al importar los colores en Ágora (separador = ,)
			end as 'color'
            FROM articuloslin AS artl2
            WHERE artl2.CODARTICULO = art.CODARTICULO
            ) as COL
		group by COL.CODARTICULO
    ) AS CO
	OUTER APPLY ( --obtención de coste medio de todas las tallas y colores
		SELECT ARTL3.CODARTICULO, AVG(ARTL3.COSTEMEDIO) AS 'Precio Coste' 
		FROM ARTICULOSLIN ARTL3 
		WHERE ARTL3.CODARTICULO = ART.CODARTICULO 
		GROUP BY ARTL3.CODARTICULO
	) AS COSTE
	OUTER APPLY ( --obtención del precio de venta máximo, independientemente de la talla y color
		SELECT ART2.CODARTICULO, MAX(PV.PNETO) as 'Precio Venta Max'
		FROM ARTICULOS ART2 LEFT JOIN PRECIOSVENTA PV ON ART2.CODARTICULO=PV.CODARTICULO
		WHERE ART2.DESCATALOGADO = 'F' AND PV.DESCATALOGADO = 0 AND PV.IDTARIFAV = 1 AND ART2.CODARTICULO=ART.CODARTICULO
		GROUP BY ART2.CODARTICULO
	) AS VENTA
where ART.DESCATALOGADO = 'F' and art.CODARTICULO > 0

GROUP BY s.DESCRIPCION, D.DESCRIPCION,
art.DESCRIPCION, art.COLORFONDO, ART.CODARTICULO, art.USASTOCKS, art.PORPESO,
TA.TALLAS, CO.COLORES, 
IMPV.IVA, IMPC.IVA, 
coste.[Precio Coste], 
VENTA.[Precio Venta Max]

HAVING REPLACE(CAST(CAST(VENTA.[Precio Venta Max] AS DECIMAL (6,2))AS NVARCHAR(7)),'.',',') IS NOT NULL`,
  stockagile: `DECLARE @IDTAFVENTA INT = {TARIFF_ID};

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
	else M.DESCRIPCION end AS 'Marca (nombre)',
case
	when cast(m.CODMARCA as varchar) is null then ''
	else cast(m.CODMARCA as varchar) end as 'Marca (código)',
case
	when T.TEMPORADA is null then ''
	else T.TEMPORADA end as 'Temporada (nombre)',
case
	when cast(T.CODTEMPORADA as varchar) is null then ''
	else cast(T.CODTEMPORADA as varchar) end as 'Temporada (código)',
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
	else ST.STOCK end as 'Existencias',
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
	LEFT JOIN STOCKS ST ON (ST.CODARTICULO = ARTL.CODARTICULO AND ST.TALLA = ARTL.TALLA AND ST.COLOR = ARTL.COLOR AND ST.STOCK > 0)

where ART.DESCATALOGADO = 'F' 
	and art.CODARTICULO > 0
	AND PV.IDTARIFAV = @IDTAFVENTA

GROUP BY s.DESCRIPCION, D.DESCRIPCION,
art.DESCRIPCION, art.COLORFONDO, ART.CODARTICULO, art.USASTOCKS, art.PORPESO,
artl.TALLA, artl.COLOR, artl.CODBARRAS,
prov.NOMPROVEEDOR, art.REFPROVEEDOR, 
m.codmarca, m.DESCRIPCION, t.CODTEMPORADA, t.TEMPORADA, IMPV.IVA, PV.PBRUTO, PV.PNETO, PV.PBRUTO2, PV.PNETO2, ST.STOCK`,

  export_clientes: `select NOMBRECLIENTE as 'Nombre Fiscal',NOMBRECOMERCIAL as 'Nombre Comercial',PAIS as 'País','' as 'Tipo de Documento',
CIF as 'CIF',CODCONTABLE as 'Cuenta Contable', TELEFONO1 as 'Teléfono',E_MAIL as 'Email','' as 'Contacto',DIRECCION1 as 'Dirección',
POBLACION as 'Población',PROVINCIA as 'Provincia',CODPOSTAL as 'Código Postal', '' as '% Descuento','' as 'Nº Tarjeta',
'' as 'Requiere Id. Tarjeta','Sí' as 'Permitir Emailing','' as 'Tarifa',tipo as 'Tipo Cliente'
FROM CLIENTES
WHERE DESCATALOGADO = 'F'`,

  export_proveedores: `select NOMPROVEEDOR as 'Nombre Fiscal',NOMCOMERCIAL as 'Nombre Comercial', CIF as 'CIF', TELEFONO1 as 'Teléfono', E_MAIL as 'Email', 
DIRECCION1 as 'Dirección', POBLACION as 'Población',PROVINCIA as 'Provincia', CODPOSTAL as 'Código Postal', PAIS as 'País', 
CODCONTABLE as 'Cuenta Contable', '' as 'Aplicar Recargo de Equivalencia',
'' as 'Mostrar Productos de este Proveedor en Documentos de Compra',
'' as 'Avisar al Crear un Documento de Compra con un Número de Documento Existente','' as 'Ocultar Precios', '' as 'Notas'
FROM PROVEEDORES
WHERE DESCATALOGADO = 'F'`
};

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

const App = () => {
  const [step, setStep] = useState('selector'); 
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingDBs, setIsFetchingDBs] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [dbConfig, setDbConfig] = useState({ server: 'LOCALHOST\\SQLEXPRESS22', user: 'sa', password: '', database: 'DBFREST' });
  const [selectedProgram, setSelectedProgram] = useState('agora_hosteleria'); 
  const [availableDatabases, setAvailableDatabases] = useState([]);
  
  const [customTemplates, setCustomTemplates] = useState({
    agora_hosteleria: localStorage.getItem('template_agora_hosteleria') || SQL_TEMPLATES.agora_hosteleria,
    agora_super: localStorage.getItem('template_agora_super') || SQL_TEMPLATES.agora_super,
    agora_tienda: localStorage.getItem('template_agora_tienda') || SQL_TEMPLATES.agora_tienda,
    stockagile: localStorage.getItem('template_stockagile') || SQL_TEMPLATES.stockagile,
    export_clientes: SQL_TEMPLATES.export_clientes,
    export_proveedores: SQL_TEMPLATES.export_proveedores
  });

  const [configs] = useState({
    agora_hosteleria: { name: 'Ágora Hostelería', icon: UtensilsCrossed, defaultDB: 'DBFREST', tariffQuery: 'SELECT * FROM TARIFASVENTA', requiresTariff: true },
    agora_super: { name: 'Ágora Supermercado', icon: ShoppingCart, defaultDB: 'ICGFRONT', tariffQuery: 'SELECT * FROM TARIFASVENTA', requiresTariff: true },
    agora_tienda: { name: 'Ágora Tienda', icon: Store, defaultDB: 'ICGFRONT', tariffQuery: 'SELECT * FROM TARIFASVENTA', requiresTariff: true },
    stockagile: { name: 'StockAgile (Retail)', icon: Shirt, defaultDB: 'ICGFRONT', tariffQuery: 'SELECT * FROM TARIFASVENTA', requiresTariff: true },
    export_clientes: { name: 'Exportar Clientes', icon: Users, defaultDB: 'DBFREST', requiresTariff: false },
    export_proveedores: { name: 'Exportar Proveedores', icon: Truck, defaultDB: 'ICGFRONT', requiresTariff: false }
  });
  
  const [selectedTariff, setSelectedTariff] = useState(null); 
  const [selectedTariffName, setSelectedTariffName] = useState('');
  const [clientName, setClientName] = useState(''); 
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [availableTariffs, setAvailableTariffs] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [executionMessage, setExecutionMessage] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('asisman_export_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error("Error historial:", e); }
    }
  }, []);

  useEffect(() => {
    if (step !== 'main' || isExpertMode) return;
    
    const config = configs[selectedProgram];
    let template = customTemplates[selectedProgram];

    if (config.requiresTariff) {
        if (!selectedTariff) return;
        template = template.replace(/{TARIFF_ID}/g, selectedTariff);
        const cleanName = String(selectedTariffName).replace(/'/g, "''").trim() || 'PVP';
        template = template.replace(/'PP PVP'/g, `'PP ${cleanName}'`)
                        .replace(/'PA PVP'/g, `'PA ${cleanName}'`)
                        .replace(/'PM PVP'/g, `'PM ${cleanName}'`);
    }
    
    setGeneratedSQL(template);
  }, [selectedProgram, selectedTariff, selectedTariffName, isExpertMode, step, customTemplates, configs]);

  const sanitizeValue = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val !== 'string') return val;
    return val.replace(/[\n\r\t;]/g, " ").replace(/\s+/g, " ").trim();
  };

  const resetAppSession = () => {
    setAvailableTariffs([]);
    setAvailableDatabases([]);
    setQueryResults(null);
    setExecutionMessage('');
    setSelectedTariff(null);
    setSelectedTariffName('');
    setClientName(''); 
  };

  const handleSaveTemplate = () => {
    if (window.confirm("¿Deseas guardar este script SQL como la nueva plantilla predeterminada para este programa?")) {
        localStorage.setItem(`template_${selectedProgram}`, generatedSQL);
        setCustomTemplates(prev => ({ ...prev, [selectedProgram]: generatedSQL }));
        alert("Plantilla actualizada.");
    }
  };

  const addToHistory = (tagName) => {
    const newItem = {
      id: Date.now(),
      program: selectedProgram,
      programName: configs[selectedProgram].name,
      tariff: configs[selectedProgram].requiresTariff ? tagName : 'N/A',
      client: clientName || 'Sin Cliente', 
      date: new Date().toLocaleString(),
      database: dbConfig.database
    };
    const updatedHistory = [newItem, ...history].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('asisman_export_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = (scope = 'all') => {
    if (window.confirm(scope === 'all' ? "¿Deseas vaciar TODO el historial?" : "¿Vaciar búsquedas de este programa?")) {
        const filtered = scope === 'all' ? [] : history.filter(item => item.program !== selectedProgram);
        setHistory(filtered);
        localStorage.setItem('asisman_export_history', JSON.stringify(filtered));
    }
  };

  const fetchDatabases = async () => {
    if (!dbConfig.server || !dbConfig.user) {
        alert("Introduzca Servidor y Usuario para listar BBDD");
        return;
    }
    setIsFetchingDBs(true);
    setConnectError('');
    try {
        const tempConfig = { ...dbConfig, database: 'master' };
        const response = await window.electronAPI.connectDB(tempConfig);
        if (response.success) {
            const res = await window.electronAPI.executeSQL("SELECT name FROM sys.databases WHERE database_id > 4 AND state_desc = 'ONLINE' ORDER BY name");
            if (res.success) {
                setAvailableDatabases(res.data.map(d => d.name));
            } else {
                setConnectError("Error de permisos: " + res.message);
            }
        } else {
            setConnectError("Error de red: " + response.message);
        }
    } catch (err) {
        setConnectError("Error crítico: " + err.message);
    } finally {
        setIsFetchingDBs(false);
    }
  };

  const handleSelectSubProgram = (key) => {
    resetAppSession(); 
    setSelectedProgram(key);
    const saved = localStorage.getItem(`config_${key}`);
    if (saved) {
        setDbConfig(JSON.parse(saved));
    } else {
        setDbConfig(prev => ({ ...prev, database: configs[key].defaultDB, password: '' }));
    }
    setStep('login');
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectError('');
    try {
      const response = await window.electronAPI.connectDB(dbConfig);
      if (response.success) {
        await window.electronAPI.executeSQL(CREATE_FUNCTION_SQL);
        setStep('main');
      } else {
        setConnectError(`Fallo de conexión: ${response.message}`);
      }
    } catch (err) {
      setConnectError(`Excepción: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleExecuteSQL = async () => {
    if (configs[selectedProgram].requiresTariff && !selectedTariff) return;
    if (!clientName.trim()) return;

    setIsExecuting(true);
    setExecutionMessage('');
    setQueryResults(null); 
    try {
      const response = await window.electronAPI.executeSQL(generatedSQL);
      if (response.success) {
        setQueryResults(response.data);
        setExecutionMessage(`Éxito: ${response.data.length} registros extraídos.`);
        addToHistory(selectedTariffName);
      } else {
        setExecutionMessage(`Error SQL (${response.code || 'BBDD'}): ${response.message}`);
      }
    } catch (err) {
      setExecutionMessage(`Fallo en el proceso: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExportExcel = () => {
    if (!queryResults || queryResults.length === 0) return;
    const sanitizedData = queryResults.map(row => {
      const cleanRow = {};
      Object.keys(row).forEach(key => { cleanRow[key] = sanitizeValue(row[key]); });
      return cleanRow;
    });
    const ws = XLSX.utils.json_to_sheet(sanitizedData);
    const wb = XLSX.utils.book_new();
    const headers = Object.keys(sanitizedData[0]);
    const colWidths = headers.map(() => ({ wch: 25 })); 
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, "Exportación");
    const cleanClient = clientName.trim().replace(/[^a-z0-9]/gi, '_');
    XLSX.writeFile(wb, `Export_${cleanClient}_${new Date().getTime()}.xlsx`);
  };

  const VirtualTable = ({ data }) => {
    const columns = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);
    const displayData = useMemo(() => data.slice(0, 100), [data]); 

    return (
      <div className="overflow-x-auto max-h-[500px] custom-scrollbar font-bold border-t border-slate-100">
        <table className="w-full text-[10px] text-left border-collapse uppercase">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              {columns.map(k => (
                <th key={k} className="p-4 whitespace-nowrap text-slate-500 border-b border-slate-200 bg-slate-50">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {displayData.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50/40 transition-colors text-slate-600">
                {columns.map((col, ci) => (
                  <td key={ci} className="p-4 whitespace-nowrap border-r border-slate-50/50">{row[col] === null ? "" : String(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 50 && (
          <div className="p-6 bg-slate-50 text-center border-t border-slate-200">
            <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">
              ⚠️ Vista previa limitada a 50 de {data.length} filas. El Excel exportará el catálogo completo.
            </p>
          </div>
        )}
      </div>
    );
  };

  const AppFooter = () => (
    <footer className="max-w-7xl mx-auto w-full mt-auto py-6 text-center border-t border-slate-200/60">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center justify-center gap-2">
          <Terminal size={12} className="text-blue-500" />
          • Software de Gestión de Exportaciones • Creado y diseñado por Rubén Aparicio Robles © 2026 Asisman
        </p>
    </footer>
  );

  const RenderHistory = ({ filterByProgram }) => {
    const displayHistory = filterByProgram 
      ? history.filter(item => item.program === selectedProgram).slice(0, 5)
      : history.slice(0, 5);

    if (displayHistory.length === 0) return null;

    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mt-8 italic">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={16} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Recientes</h3>
          </div>
          <button onClick={() => clearHistory(filterByProgram ? 'program' : 'all')} className="text-[9px] font-black text-slate-300 hover:text-red-500 uppercase tracking-tighter transition-colors">Limpiar</button>
        </div>
        <div className="space-y-2">
          {displayHistory.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600 transition-colors">
                    {item.program.includes('agora') || item.program.includes('export') ? <Database size={14}/> : <Shirt size={14}/>}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700 uppercase tracking-tight truncate max-w-[250px]">{item.client} <span className="text-blue-400">|</span> {item.programName} {item.tariff !== 'N/A' && `| ${item.tariff}`}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">{item.date}</p>
                  </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- RENDERIZADO DE PASOS ---

  if (step === 'selector') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col p-4 font-sans italic text-slate-800">
        <div className="flex-grow flex flex-col items-center justify-center pb-12">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-10">
              <img src="logo.png" alt="Asisman" className="w-64 mx-auto mb-6 drop-shadow-xl" />
              <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2">Exportador Bases de Datos ICG</h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Gestor de exportaciones de BBDD</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <button onClick={() => setStep('sub-selector-agora')} className="group bg-white p-12 rounded-[3rem] border-4 border-transparent hover:border-blue-500 shadow-2xl transition-all flex flex-col items-center">
                <Database size={64} className="text-slate-200 group-hover:text-blue-500 mb-6 transition-colors" />
                <h2 className="text-3xl font-black uppercase tracking-tighter">Ágora</h2>
              </button>
              <button onClick={() => handleSelectSubProgram('stockagile')} className="group bg-white p-12 rounded-[3rem] border-4 border-transparent hover:border-emerald-500 shadow-2xl transition-all flex flex-col items-center">
                <Shirt size={64} className="text-slate-200 group-hover:text-emerald-500 mb-6 transition-colors" />
                <h2 className="text-3xl font-black uppercase tracking-tighter">StockAgile</h2>
              </button>
            </div>
            <div className="max-w-md mx-auto mb-12"><RenderHistory filterByProgram={false} /></div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (step === 'sub-selector-agora') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col p-4 font-sans italic text-slate-800">
        <div className="flex-grow flex flex-col items-center justify-center pb-12">
          <div className="max-w-6xl w-full">
            <div className="text-center mb-10">
                <button onClick={() => setStep('selector')} className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 mb-4 inline-flex items-center gap-2 transition-colors">← Inicio</button>
                <h2 className="text-4xl font-black uppercase tracking-tight">Variantes de Ágora</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {[
                    { id: 'agora_hosteleria', name: 'Hostelería', icon: UtensilsCrossed, color: 'hover:border-blue-500' },
                    { id: 'agora_super', name: 'Supermercado', icon: ShoppingCart, color: 'hover:border-emerald-500' },
                    { id: 'agora_tienda', name: 'Tienda (Retail)', icon: Store, color: 'hover:border-orange-500' }
                ].map(opt => (
                    <button key={opt.id} onClick={() => handleSelectSubProgram(opt.id)} className={`group bg-white p-10 rounded-[2.5rem] border-4 border-transparent ${opt.color} shadow-xl transition-all flex flex-col items-center`}>
                        <div className="p-5 bg-slate-50 rounded-2xl mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all"><opt.icon size={40} /></div>
                        <h3 className="font-black uppercase text-xl">{opt.name}</h3>
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
                {[
                    { id: 'export_clientes', name: 'Exportar Clientes', icon: Users, color: 'hover:border-yellow-500' },
                    { id: 'export_proveedores', name: 'Exportar Proveedores', icon: Truck, color: 'hover:border-red-500' }
                ].map(opt => (
                    <button key={opt.id} onClick={() => handleSelectSubProgram(opt.id)} className={`group bg-white p-8 rounded-[2rem] border-4 border-transparent ${opt.color} shadow-lg transition-all flex items-center gap-6`}>
                        <div className="p-4 bg-slate-50 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all"><opt.icon size={32} /></div>
                        <h3 className="font-black uppercase text-lg tracking-tight">{opt.name}</h3>
                    </button>
                ))}
            </div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col p-4 font-sans italic text-slate-800">
        <div className="flex-grow flex flex-col items-center justify-center pb-12">
          <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-10 text-center text-white relative">
              <button onClick={() => setStep(selectedProgram.startsWith('agora') || selectedProgram.startsWith('export') ? 'sub-selector-agora' : 'selector')} className="absolute left-6 top-8 text-white/40 hover:text-white text-[10px] font-black uppercase transition-colors">Volver</button>
              <Server className="w-14 h-14 mx-auto mb-4 text-blue-500" />
              <h1 className="text-2xl font-black uppercase tracking-tight">Conexión SQL Server</h1>
            </div>
            <form onSubmit={handleConnect} className="p-10 space-y-6">
              {connectError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase border border-red-100 flex items-center gap-3 animate-pulse">
                  <XCircle size={16} /> {connectError}
                </div>
              )}
              <div className="space-y-5">
                  <div className="group border-b-2 border-slate-100 focus-within:border-blue-600 transition-all">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Instancia Servidor</label>
                      <input type="text" className="w-full pb-3 outline-none font-bold text-slate-800 bg-transparent uppercase transition-all" value={dbConfig.server} onChange={(e) => setDbConfig({...dbConfig, server: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-6 font-black">
                      <div className="border-b-2 border-slate-100 focus-within:border-blue-600">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Usuario SQL</label>
                          <input type="text" className="w-full pb-3 outline-none font-bold text-slate-800 bg-transparent" value={dbConfig.user} onChange={(e) => setDbConfig({...dbConfig, user: e.target.value})} />
                      </div>
                      <div className="border-b-2 border-slate-100 focus-within:border-blue-600">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Password</label>
                          <input type="password" name="password" className="w-full pb-3 outline-none font-bold text-slate-800 bg-transparent" value={dbConfig.password} onChange={(e) => setDbConfig({...dbConfig, password: e.target.value})} />
                      </div>
                  </div>
                  <div className="group border-b-2 border-slate-100 focus-within:border-blue-600 transition-all relative">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base de Datos</label>
                        <button type="button" onClick={fetchDatabases} disabled={isFetchingDBs} className="text-[8px] font-black text-blue-600 hover:text-blue-800 uppercase flex items-center gap-1 transition-all">
                            {isFetchingDBs ? <Loader2 size={10} className="animate-spin" /> : <Search size={10}/>} Listar BBDD
                        </button>
                      </div>
                      <div className="relative">
                        {availableDatabases.length > 0 ? (
                          <>
                            <select className="w-full pb-3 outline-none font-bold text-slate-800 bg-transparent appearance-none cursor-pointer pr-8 uppercase transition-all" value={dbConfig.database} onChange={(e) => setDbConfig({...dbConfig, database: e.target.value})}>
                                {availableDatabases.map(db => <option key={db} value={db}>{db}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-0 bottom-4 text-slate-400 pointer-events-none" />
                          </>
                        ) : (
                          <input type="text" className="w-full pb-3 outline-none font-bold text-slate-800 bg-transparent placeholder-slate-300 uppercase" value={dbConfig.database} onChange={(e) => setDbConfig({...dbConfig, database: e.target.value})} placeholder="Ej: DBFREST..." />
                        )}
                      </div>
                  </div>
              </div>
              <button type="submit" disabled={isConnecting} className="w-full py-6 bg-blue-600 text-white rounded-[1.5rem] font-black hover:bg-blue-700 shadow-xl shadow-blue-100 uppercase tracking-widest transition-all active:scale-95 italic tracking-tight">
                  {isConnecting ? <Loader2 className="animate-spin mx-auto" /> : "Conectar al Motor SQL"}
              </button>
              <button type="button" onClick={() => {
                localStorage.setItem(`config_${selectedProgram}`, JSON.stringify({...dbConfig, password: ''})); 
                alert(`Preferencias de ${configs[selectedProgram].name} guardadas.`);
              }} className="w-full py-2 bg-slate-50 text-slate-300 rounded-lg text-[10px] font-black uppercase hover:bg-slate-100 transition-colors border-2 border-dashed italic mb-8"><Save size={12} className="inline mr-1"/> Recordar Datos</button>
            </form>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  // --- PANEL PRINCIPAL DE EXTRACCIÓN ---
  const canExecute = (configs[selectedProgram].requiresTariff ? selectedTariff !== null : true) && clientName.trim().length > 0;
  const CurrentIcon = configs[selectedProgram]?.icon;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800 flex flex-col italic">
      <header className="max-w-7xl mx-auto w-full mb-10 flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 font-black uppercase text-sm">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-400"><Server size={20} /></div>
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-400 tracking-widest uppercase">Servidor Activo</span>
              <span className="leading-tight">{dbConfig.server} / {dbConfig.database}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-5 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                {CurrentIcon && <CurrentIcon size={14} className="text-blue-400"/>} {configs[selectedProgram]?.name}
            </div>
            <button onClick={() => { resetAppSession(); setStep('selector'); }} className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 p-3 rounded-xl transition-all">Desconectar</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-12 gap-10 flex-grow pb-12">
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
        <div className="col-span-4 space-y-8">
          
          {configs[selectedProgram].requiresTariff && (
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm border-slate-200 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><Search size={16}/> 1. Tarifa de Precios</h2>
                    <button onClick={async () => {
                        setIsExecuting(true);
                        const res = await window.electronAPI.executeSQL(configs[selectedProgram].tariffQuery);
                        if (res.success) setAvailableTariffs(res.data.map(r => ({ id: r.IDTARIFAV || r.CODTARIFA || 0, nombre: r.DESCRIPCION || r.NOMBRE || 'Tarifa' })));
                        setIsExecuting(false);
                    }} className="text-blue-600 text-[9px] font-black px-5 py-2 bg-blue-50 rounded-full hover:bg-blue-100 uppercase tracking-tighter transition-all italic">Buscar</button>
                </div>
                <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-3 custom-scrollbar font-black text-[10px] uppercase">
                {availableTariffs.length > 0 ? availableTariffs.map(t => (
                    <button key={t.id} onClick={() => {setSelectedTariff(t.id); setSelectedTariffName(t.nombre);}} className={`p-5 rounded-2xl border-2 text-left transition-all ${selectedTariff === t.id ? "bg-blue-600 text-white border-blue-600 shadow-xl" : "bg-white border-slate-100 text-slate-500 hover:border-blue-300"}`}>
                        <div className="flex justify-between items-center">
                            <span className="truncate pr-2">{t.nombre}</span>
                            <span className={`text-[8px] px-2 py-1 rounded-md shrink-0 ${selectedTariff === t.id ? 'bg-blue-500/50 text-white' : 'bg-slate-100 text-slate-400'}`}>ID: {t.id}</span>
                        </div>
                    </button>
                )) : (
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <p className="text-[9px] uppercase font-black text-slate-300 tracking-[0.2em]">Cargue las tarifas de la BBDD</p>
                    </div>
                )}
                </div>
            </div>
          )}

          <div className={`bg-white p-8 rounded-[2.5rem] border-2 shadow-sm transition-all duration-500 ${clientName.trim() ? 'border-green-300 bg-green-50/5' : 'border-slate-100'}`}>
             <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 mb-6"><Tag size={16}/> {configs[selectedProgram].requiresTariff ? '2.' : '1.'} Cliente / Establecimiento</h2>
             <input 
                type="text" 
                className="w-full p-5 bg-white border-2 border-slate-200 rounded-[1.5rem] outline-none focus:border-blue-600 font-black text-xs uppercase shadow-inner italic transition-all"
                placeholder="ESCRIBA EL NOMBRE..."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
             />
          </div>

          <button onClick={handleExecuteSQL} disabled={isExecuting || !canExecute} className={`w-full py-7 rounded-[2.5rem] font-black text-white shadow-2xl flex justify-center items-center gap-4 transition-all transform active:scale-95 uppercase tracking-[0.2em] italic ${isExecuting || !canExecute ? 'bg-slate-300 cursor-not-allowed grayscale' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}>
            {isExecuting ? <Loader2 className="animate-spin" /> : (
                <>{canExecute ? <Play fill="currentColor" size={24}/> : <LockIcon size={24}/>} {canExecute ? 'Extraer Datos' : 'Incompleto'}</>
            )}
          </button>
        </div>

        {/* COLUMNA DERECHA: CONSOLA SQL Y RESULTADOS */}
        <div className="col-span-8 space-y-8">
          <div className="bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[350px] border-[12px] border-slate-800 transition-all">
            <div className="bg-slate-800 p-5 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3 text-white font-mono text-[10px] font-black uppercase tracking-widest">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                    <span className="ml-4 opacity-50 italic">ENGINE_SQL_OUTPUT_V2</span>
                </div>
                <div className="flex gap-3">
                    {isExpertMode && (
                        <button onClick={handleSaveTemplate} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase flex items-center gap-2 transition-all italic shadow-lg animate-in fade-in slide-in-from-right-4"><Save size={14}/> Fijar Script</button>
                    )}
                    <button onClick={() => setIsExpertMode(!isExpertMode)} className={`px-5 py-2 rounded-full text-[9px] font-black uppercase flex items-center gap-2 transition-all ${isExpertMode ? "bg-orange-500 text-white shadow-xl" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>
                        {isExpertMode ? <Unlock size={14}/> : <LockIcon size={14}/>} {isExpertMode ? 'Modo Edición' : 'Bloqueado'}
                    </button>
                </div>
            </div>
            <textarea 
                className={`flex-1 p-8 font-mono text-[11px] outline-none resize-none transition-all leading-relaxed ${isExpertMode ? "bg-slate-800 text-white shadow-inner" : "bg-slate-900 text-emerald-400 opacity-90"}`}
                value={generatedSQL}
                readOnly={!isExpertMode}
                onChange={(e) => isExpertMode && setGeneratedSQL(e.target.value)}
                spellCheck="false"
            />
          </div>
          
          {executionMessage && (
            <div className={`p-6 rounded-[1.5rem] text-[10px] font-black flex items-center gap-4 uppercase tracking-widest shadow-xl animate-in slide-in-from-bottom border-2 italic transition-all ${executionMessage.includes('Error') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-600 text-white border-blue-400'}`}>
              {executionMessage.includes('Error') ? <AlertCircle size={24}/> : <CheckCircle size={24}/>} {executionMessage}
            </div>
          )}

          {queryResults && (
            <div className="bg-white rounded-[3rem] border shadow-2xl overflow-hidden border-slate-200 animate-in fade-in zoom-in-95 duration-300">
              <div className="p-8 border-b flex justify-between items-center bg-white transition-colors">
                <div className="flex flex-col">
                    <span className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-3"><TableIcon size={20} className="text-blue-600"/> Catálogo Exportable ({queryResults.length} ítems)</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-2 italic tracking-tight">Motor: {dbConfig.database} • Cliente: {clientName}</span>
                </div>
                <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-10 py-5 rounded-[1.5rem] text-xs font-black flex items-center gap-4 hover:bg-emerald-700 shadow-xl shadow-emerald-50 transition-all uppercase tracking-[0.2em] italic">
                    <FileSpreadsheet size={22}/> Generar Excel (.xlsx)
                </button>
              </div>
              <VirtualTable data={queryResults} />
            </div>
          )}

          <div className="mb-12"><RenderHistory filterByProgram={true} /></div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
};

export default App;