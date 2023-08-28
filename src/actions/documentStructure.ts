import fsp  from "fs/promises"
import path from "path"
import yaml from "yaml"

import { BaseConfig              } from "lpil-modules/dist/lib/configBase.js"
import { BuildConfig             } from "lpil-modules/dist/lib/configBuild.js"

import { Logging, ValidLogger  } from "lpil-modules/dist/lib/logging.js"
import { IConfig } from "lpil-modules/dist/lib/cfgrCollector"
const logger : ValidLogger = Logging.getLogger('lpil')

const secTypes : Array<string> = [
  'matter',
  'part',
  'chapter',
  'section',
  'subsection',
  'subsubsection',
  'paragraph',
  'subparagraph'
]

class Sections {
  secType    : string
  //secTypeNum : number
  refID      : string
  shortTitle : string
  title      : string

  constructor(secType : string, refId : string, shortTitle : string, title : string) {
    this.secType    = secType
    //this.secTypeNum = secTypes.findIndex(function(value : string){
    //  return value == secType
    //})
    this.refID      = refId
    this.shortTitle = shortTitle
    this.title      = title
  }
}

class FileNames {
  fileName : string

  constructor(fileName : string) {
    this.fileName = fileName
  }
}

class Labels {
  refID : string
  constructor(refID: string) {
    this.refID = refID
  }
}

type DocParts = Sections | FileNames | Labels

export class DocumentStructure {
  sections : Map<string,Array<DocParts>> = new Map()

  addSection(fileName : string, secType : string, refId : string, shortTitle : string, title : string) {
    var fileSections = this.sections.get(fileName)
    if (!fileSections) fileSections = new Array<DocParts>()
    fileSections.push(new Sections(secType, refId, shortTitle, title))
    this.sections.set(fileName, fileSections)
  }

  addFile(baseFileName : string, subFileName : string) {
    var fileSections = this.sections.get(baseFileName)
    if (!fileSections) fileSections = new Array<DocParts>()
    fileSections.push(new FileNames(subFileName))
    this.sections.set(baseFileName, fileSections)
  }

  addLabel(baseFileName : string, refID : string ) {
    var fileSections = this.sections.get(baseFileName)
    if (!fileSections) fileSections = new Array<DocParts>()
    fileSections.push(new Labels(refID))
    this.sections.set(baseFileName, fileSections)
  }

  addSectionToDocStructure(aSection : Sections, docStruc : any) {
    var requestedType = aSection.secType
    // should this just be a check that it is in secTypes
    // and if it isn't then make it 'matter'
    if (requestedType.endsWith('matter'))   requestedType = 'matter'
    if (requestedType.endsWith('title'))    requestedType = 'matter'
    if (requestedType.endsWith('appendix')) requestedType = 'matter'
    logger.trace(`addSectionToDocStructure ${requestedType}`)
    logger.trace("-------------------------------------------------------------")
    logger.trace(aSection)
    logger.trace(docStruc)
    var curLevel = 0
    var curDocStruc = docStruc
    for (var curLevel = 0 ; curLevel < secTypes.length; curLevel++) {
      if (secTypes[curLevel] == requestedType) {
        curDocStruc.push({
          'secType'    : aSection.secType,
          'refID'      : aSection.refID,
          'shortTitle' : aSection.shortTitle,
          'title'      : aSection.title,
          'children'   : []
        })
        logger.trace(docStruc)
        return
      }
      if ((curDocStruc.length < 1) ||
         (!('children' in curDocStruc[curDocStruc.length - 1]))) {
        curDocStruc.push({
          'secType'  : secTypes[curLevel],
          'children' : []
        })
      }
      curDocStruc = curDocStruc[curDocStruc.length - 1]['children']
    }
    logger.trace(docStruc)
    logger.trace("-------------------------------------------------------------")
  }

  addLabelToDocStructure(aLabel : Labels, docStruc : any) {
    var curLevel = 0
    var curDocStruc = docStruc
    for (var curLevel = 0 ; curLevel < secTypes.length; curLevel++) {
      if ((curDocStruc.length < 1) ||
         (!('children' in curDocStruc[curDocStruc.length - 1]))) break
      curDocStruc = curDocStruc[curDocStruc.length - 1]['children']
    }
    curDocStruc.push({
      //'secType'    : aSection.secType,
      'refID'      : aLabel.refID,
      //'shortTitle' : aSection.shortTitle,
      //'title'      : aSection.title,
      //'children'   : []
    })
  }

  addDocStructure(aFileName : string, docStruct : any) {
    logger.trace(`addDocStructure ${aFileName}`)
    logger.trace(docStruct)
    const fileSections : Array<DocParts> | undefined = this.sections.get(aFileName)
    if (!fileSections) {
      console.log(`WARNING: file ${aFileName} has not been scanned`)
      return
    }
    for (const aSection of fileSections) {
      if (aSection instanceof FileNames) {
        this.addDocStructure(aSection.fileName, docStruct)
        continue
      }
      if (aSection instanceof Sections) {
        this.addSectionToDocStructure(aSection, docStruct)
        continue
      }
      if (aSection instanceof Labels) {
        this.addLabelToDocStructure(aSection, docStruct)
        continue
      }
    }
  }

  async finalize(config: IConfig) {
    const baseConfig = <BaseConfig>config
    const baseFileName = baseConfig.initialFile

    var docStruc : Array<any> = []
    this.addDocStructure(baseFileName, docStruc)
    //console.log("--------------------------------------------------")
    //console.log(yaml.stringify(docStruc))

    const buildConfig = <BuildConfig>config
    //const srcDir   = config.replaceTemplate(buildConfig.srcDir)
    //logger.trace(`ENSURING the [${srcDir}] directory exists`)
    //await fsp.mkdir(srcDir, { recursive: true })
    
    const latexDir = config.replaceTemplate(buildConfig.latexDir)
    logger.trace(`ENSURING the [${latexDir}] directory exists`)
    await fsp.mkdir(latexDir, { recursive: true })

    // write out this document map...
    const docStrucPath = path.join(latexDir, 'documentStructure.yaml')
    logger.debug(`WRITING document map for [${baseFileName}] to [${docStrucPath}]`)
    await fsp.writeFile(docStrucPath, yaml.stringify(docStruc))
  }
}