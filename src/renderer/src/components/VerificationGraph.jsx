import { useEffect, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import { select } from 'd3-selection'
import { zoom as d3Zoom } from 'd3-zoom'
import { drag as d3Drag } from 'd3-drag'
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force'
import { Box, Typography } from '@mui/material'

const DEFAULT_SIZE = { width: 640, height: 420 }

function parseAttributes(attributeString = '') {
  const attributes = {}
  const regex = /([A-Za-z_][\w-]*)="([^"]*)"/g
  let match
  while ((match = regex.exec(attributeString)) !== null) {
    attributes[match[1]] = match[2]
  }
  return attributes
}

function parseDot(dotText = '') {
  const nodes = []
  const nodeById = new Map()
  const edges = []

  dotText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (line.startsWith('//')) return

      const nodeMatch = line.match(/^"?([\w.-]+)"?\s*\[(.*)\];?$/)
      if (nodeMatch) {
        const id = nodeMatch[1]
        const attributes = parseAttributes(nodeMatch[2])
        const label = attributes.vloc || attributes.labels || id
        const node = {
          id,
          label,
          attributes
        }
        nodes.push(node)
        nodeById.set(id, node)
        return
      }

      const edgeMatch = line.match(/^"?([\w.-]+)"?\s*->\s*"?([\w.-]+)"?\s*\[(.*)\];?$/)
      if (edgeMatch) {
        const attributes = parseAttributes(edgeMatch[3])
        edges.push({
          source: edgeMatch[1],
          target: edgeMatch[2],
          label: attributes.vedge || attributes.sync || ''
        })
      }
    })

  return { nodes, edges }
}

const VerificationGraph = ({ dotText, height = DEFAULT_SIZE.height }) => {
  const containerRef = useRef(null)
  const svgRef = useRef(null)

  const graphData = useMemo(() => parseDot(dotText), [dotText])

  useEffect(() => {
    const container = containerRef.current
    const svgElement = svgRef.current
    if (!container || !svgElement || graphData.nodes.length === 0) return

    const rect = container.getBoundingClientRect()
    const width = rect.width || DEFAULT_SIZE.width
    const viewHeight = height || DEFAULT_SIZE.height

    const svg = select(svgElement)
    svg.selectAll('*').remove()

    const rootGroup = svg
      .attr('viewBox', `0 0 ${width} ${viewHeight}`)
      .attr('width', '100%')
      .attr('height', viewHeight)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')

    svg.call(
      d3Zoom()
        .scaleExtent([0.3, 2.5])
        .on('zoom', (event) => rootGroup.attr('transform', event.transform))
    )

    const simulation = forceSimulation(graphData.nodes)
      .force(
        'link',
        forceLink(graphData.edges)
          .id((d) => d.id)
          .distance(120)
      )
      .force('charge', forceManyBody().strength(-500))
      .force('center', forceCenter(width / 2, viewHeight / 2))

    const linkGroup = rootGroup.append('g').attr('stroke', '#999').attr('stroke-opacity', 0.6)

    const link = linkGroup
      .selectAll('g')
      .data(graphData.edges)
      .enter()
      .append('g')

    link
      .append('line')
      .attr('stroke-width', 2)

    link
      .append('text')
      .attr('fill', '#555')
      .attr('font-size', 12)
      .attr('text-anchor', 'middle')
      .attr('dy', -4)
      .text((d) => d.label)

    const nodeGroup = rootGroup.append('g')

    const node = nodeGroup
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .call(
        d3Drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    node
      .append('circle')
      .attr('r', 26)
      .attr('fill', '#1976d2')
      .attr('stroke', '#0d47a1')
      .attr('stroke-width', 1.5)

    node
      .append('text')
      .attr('fill', '#fff')
      .attr('font-size', 12)
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .text((d) => d.label)

    simulation.on('tick', () => {
      link
        .select('line')
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      link
        .select('text')
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2)

      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [graphData, height])

  if (!graphData.nodes.length) {
    return (
      <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
        <Typography variant="body2">No graph information available.</Typography>
      </Box>
    )
  }

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: height || DEFAULT_SIZE.height }}>
      <svg ref={svgRef} />
    </Box>
  )
}

VerificationGraph.propTypes = {
  dotText: PropTypes.string,
  height: PropTypes.number
}

export default VerificationGraph
