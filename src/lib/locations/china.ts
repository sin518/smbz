import areaJson from "province-city-china/dist/area.json";
import cityJson from "province-city-china/dist/city.json";
import provinceJson from "province-city-china/dist/province.json";

interface ProvinceRecord {
  code: string;
  name: string;
  province: string;
}

interface CityRecord {
  code: string;
  name: string;
  province: string;
  city: string;
}

interface AreaRecord {
  code: string;
  name: string;
  province: string;
  city: string;
  area: string;
}

export interface ChinaCityOption {
  city: string;
  districts: string[];
}

export interface ChinaProvinceOption {
  province: string;
  cities: ChinaCityOption[];
}

const provinces = provinceJson as ProvinceRecord[];
const cities = cityJson as CityRecord[];
const areas = areaJson as AreaRecord[];

export const chinaLocationOptions: ChinaProvinceOption[] = provinces.map((province) => {
  const provinceCities = cities.filter((city) => city.province === province.province);
  const normalizedCities = provinceCities.length > 0 ? provinceCities : buildMunicipalityCity(province);

  return {
    province: province.name,
    cities: normalizedCities.map((city) => ({
      city: city.name,
      districts: getDistrictNames(province.province, city.city)
    }))
  };
});

function buildMunicipalityCity(province: ProvinceRecord): CityRecord[] {
  const areaCityCodes = Array.from(new Set(areas.filter((area) => area.province === province.province).map((area) => area.city)));
  const cityCode = areaCityCodes[0] ?? "01";

  return [
    {
      code: `${province.province}${cityCode}00`,
      name: province.name,
      province: province.province,
      city: cityCode
    }
  ];
}

function getDistrictNames(provinceCode: string, cityCode: string) {
  const districts = areas.filter((area) => area.province === provinceCode && area.city === cityCode).map((area) => area.name);

  return districts.length > 0 ? districts : ["市辖区"];
}
