#!/bin/bash

ver=$(<VERSION)
assembly_info=Properties/AssemblyInfo.cs

if [ -f "$assembly_info" ]
then 
    echo "[assembly: AssemblyInformationalVersion(\"$ver\")]" >> "$assembly_info"
fi
