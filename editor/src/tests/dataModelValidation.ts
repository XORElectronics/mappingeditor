import { DataModel, type MappingTuple, type MappingType } from '../modules/dataModel';

const dataModel = DataModel;

for (let sourceType of dataModel.sourceTypes as MappingType[]) {
    console.assert(sourceType.abbr !== undefined, `Source Type abbr should be defined for ${sourceType.description}`);
    console.assert(sourceType.abbr.length === 4, `Source Type abbr should be 4 characters long, but was ${sourceType.abbr?.length}, with value ${sourceType.abbr}, for ${sourceType.description}`);
    for(let sourceFunction of sourceType.functions as MappingTuple[]) {
        console.assert(sourceFunction.abbr !== undefined, `Source Function abbr should be defined for ${sourceFunction.description}`)
        console.assert(sourceFunction.abbr.length === 4, `Source Function abbr should be 4 characters long, but was ${sourceFunction.abbr?.length}, with value ${sourceFunction.abbr}, for ${sourceFunction.description}`);
    }
    for(let sourceExtra of sourceType.extras as MappingTuple[]) {
        console.assert(sourceExtra.abbr !== undefined, `Source Extra abbr should be defined for ${sourceExtra.description}`);
        console.assert(sourceExtra.abbr?.length === 4, `Source Extra abbr should be 4 characters long, but was ${sourceExtra.abbr?.length} with value ${sourceExtra.abbr}, for ${sourceExtra.description}`);
    }
}

for (let destinationType of dataModel.destinationTypes as MappingType[]) {
    console.assert(destinationType.abbr !== undefined, `Destination Type abbr should be defined for ${destinationType.description}`);
    console.assert(destinationType.abbr.length === 4, `Destination Type abbr should be 4 characters long, but was ${destinationType.abbr.length} with value ${destinationType.abbr}, for ${destinationType.description}`);
    for(let destinationFunction of destinationType.functions as MappingTuple[]) {
        console.assert(destinationFunction.abbr !== undefined, `Destination Function abbr should be defined for ${destinationFunction.description}`);
        console.assert(destinationFunction.abbr.length === 4, `Destination Function abbr should be 4 characters long, but was ${destinationFunction.abbr?.length} with value ${destinationFunction.abbr}, for ${destinationFunction.description}`);
    }
    for(let destinationExtra of destinationType.extras as MappingTuple[]) {
        console.assert(destinationExtra.abbr !== undefined, `Destination Extra abbr should be defined for ${destinationExtra.description}`);
        console.assert(destinationExtra.abbr?.length === 4, `Destination Extra abbr should be 4 characters long, but was ${destinationExtra.abbr?.length} with value ${destinationExtra.abbr}, for ${destinationExtra.description}`);
    }
}